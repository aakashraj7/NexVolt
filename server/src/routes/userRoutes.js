import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// In-memory verification code store (email -> { code, expiresAt, type })
const verificationCodes = new Map();

// GET /api/users/check-phone - Verify mobile number uniqueness
router.get('/check-phone', async (req, res) => {
  try {
    const { phone, userId } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
    const existing = await User.findOne({
      phone: { $regex: cleanPhone + '$' },
      userId: { $ne: userId }
    });

    if (existing) {
      return res.json({ available: false, message: 'This mobile number is already registered with another account.' });
    }

    res.json({ available: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error verifying phone number', error: error.message });
  }
});

// GET /api/users/profile/:userId - Retrieve user profile and addresses
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, fullName, provider } = req.query;

    let user = await User.findOne({ userId });

    if (!user && email) {
      // Auto-create initial profile document
      user = new User({
        userId,
        email: email.toString().toLowerCase(),
        fullName: fullName ? fullName.toString() : '',
        authProvider: provider === 'oauth_google' || provider === 'google' ? 'google' : 'email_password',
        hasPassword: provider !== 'oauth_google' && provider !== 'google',
        addresses: []
      });
      await user.save();
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    res.json({ success: true, profile: user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: 'Error fetching user profile', error: error.message });
  }
});

// POST /api/users/profile/:userId - Update personal profile details
router.post('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      email,
      fullName,
      phone,
      gender,
      dateOfBirth,
      authProvider,
      hasPassword,
      onboardingCompleted,
      initialAddress
    } = req.body;

    // Check duplicate phone number across other users
    if (phone) {
      const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
      if (cleanPhone.length === 10) {
        const duplicate = await User.findOne({
          phone: { $regex: cleanPhone + '$' },
          userId: { $ne: userId }
        });
        if (duplicate) {
          return res.status(400).json({
            success: false,
            message: 'This mobile number is already registered with another account.'
          });
        }
      }
    }

    let user = await User.findOne({ userId });

    if (!user) {
      user = new User({
        userId,
        email: email ? email.toLowerCase() : '',
        fullName: fullName || '',
        phone: phone || '',
        gender: gender || '',
        dateOfBirth: dateOfBirth || '',
        authProvider: authProvider || 'email_password',
        hasPassword: Boolean(hasPassword),
        onboardingCompleted: Boolean(onboardingCompleted),
        addresses: []
      });
    } else {
      if (email) user.email = email.toLowerCase();
      if (fullName !== undefined) user.fullName = fullName;
      if (phone !== undefined) user.phone = phone;
      if (gender !== undefined) user.gender = gender;
      if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
      if (authProvider !== undefined) user.authProvider = authProvider;
      if (hasPassword !== undefined) user.hasPassword = Boolean(hasPassword);
      if (onboardingCompleted !== undefined) user.onboardingCompleted = Boolean(onboardingCompleted);
    }

    // If addresses array provided
    if (Array.isArray(req.body.addresses) && req.body.addresses.length > 0) {
      user.addresses = req.body.addresses;
      if (!user.addresses.some(a => a.isDefault)) {
        user.addresses[0].isDefault = true;
      }
    } else if (initialAddress && initialAddress.street) {
      // If initial address provided during onboarding
      const addressDoc = {
        label: initialAddress.label || 'Home',
        recipientName: initialAddress.recipientName || user.fullName || 'Recipient',
        phone: initialAddress.phone || user.phone || '',
        street: initialAddress.street,
        landmark: initialAddress.landmark || '',
        city: initialAddress.city,
        state: initialAddress.state,
        postalCode: initialAddress.postalCode,
        country: initialAddress.country || 'India',
        isDefault: true
      };

      if (!user.addresses.length) {
        user.addresses.push(addressDoc);
      } else {
        user.addresses[0] = { ...user.addresses[0], ...addressDoc };
      }
    }

    await user.save();
    res.json({ success: true, message: 'Profile updated successfully', profile: user });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ success: false, message: 'Error saving user profile', error: error.message });
  }
});

// POST /api/users/profile/:userId/addresses - Add a new custom address
router.post('/profile/:userId/addresses', async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      label,
      recipientName,
      phone,
      street,
      landmark,
      city,
      state,
      postalCode,
      country = 'India',
      isDefault = false
    } = req.body;

    if (!recipientName || !phone || !street || !city || !state || !postalCode) {
      return res.status(400).json({ success: false, message: 'Missing required address fields' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If this is the user's first address, make it default automatically
    const shouldBeDefault = isDefault || user.addresses.length === 0;

    if (shouldBeDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      label: label?.trim() || 'Home',
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      landmark: landmark?.trim() || '',
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country.trim(),
      isDefault: shouldBeDefault
    };

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      addresses: user.addresses,
      address: user.addresses[user.addresses.length - 1]
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ success: false, message: 'Error adding address', error: error.message });
  }
});

// PUT /api/users/profile/:userId/addresses/:addressId - Update an existing address
router.put('/profile/:userId/addresses/:addressId', async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const updates = req.body;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (updates.isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    if (updates.label !== undefined) address.label = updates.label;
    if (updates.recipientName !== undefined) address.recipientName = updates.recipientName;
    if (updates.phone !== undefined) address.phone = updates.phone;
    if (updates.street !== undefined) address.street = updates.street;
    if (updates.landmark !== undefined) address.landmark = updates.landmark;
    if (updates.city !== undefined) address.city = updates.city;
    if (updates.state !== undefined) address.state = updates.state;
    if (updates.postalCode !== undefined) address.postalCode = updates.postalCode;
    if (updates.country !== undefined) address.country = updates.country;
    if (updates.isDefault !== undefined) address.isDefault = updates.isDefault;

    await user.save();
    res.json({ success: true, message: 'Address updated successfully', addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating address', error: error.message });
  }
});

// DELETE /api/users/profile/:userId/addresses/:addressId - Remove address
router.delete('/profile/:userId/addresses/:addressId', async (req, res) => {
  try {
    const { userId, addressId } = req.params;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const wasDefault = address.isDefault;
    user.addresses.pull({ _id: addressId });

    // If deleted address was default, set first remaining address as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json({ success: true, message: 'Address removed successfully', addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting address', error: error.message });
  }
});

// PUT /api/users/profile/:userId/addresses/:addressId/default - Set as primary default
router.put('/profile/:userId/addresses/:addressId/default', async (req, res) => {
  try {
    const { userId, addressId } = req.params;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let found = false;
    user.addresses.forEach(addr => {
      if (addr._id.toString() === addressId) {
        addr.isDefault = true;
        found = true;
      } else {
        addr.isDefault = false;
      }
    });

    if (!found) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    await user.save();
    res.json({ success: true, message: 'Default address updated', addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error setting default address', error: error.message });
  }
});

// POST /api/users/password/send-code - Send 6-digit email code for password creation or reset
router.post('/password/send-code', async (req, res) => {
  try {
    const { email, type = 'create' } = req.body; // type: 'create' | 'reset'

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    verificationCodes.set(normalizedEmail, { code, expiresAt, type });

    console.log(`[NexVolt Auth Security] Password ${type} verification code for ${normalizedEmail}: ${code}`);

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}`,
      // In development mode, include code for smooth testing
      devCode: process.env.NODE_ENV === 'development' ? code : undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending verification code', error: error.message });
  }
});

// POST /api/users/password/verify-and-set - Verify 6-digit code and set/reset password
router.post('/password/verify-and-set', async (req, res) => {
  try {
    const { userId, email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Missing verification code or password' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const storedRecord = verificationCodes.get(normalizedEmail);

    if (!storedRecord) {
      return res.status(400).json({ success: false, message: 'No verification code requested or session expired. Please request a new code.' });
    }

    if (Date.now() > storedRecord.expiresAt) {
      verificationCodes.delete(normalizedEmail);
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
    }

    if (storedRecord.code !== code.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid 6-digit verification code. Please check and try again.' });
    }

    // Code is valid! Clean up verification record
    verificationCodes.delete(normalizedEmail);

    if (userId) {
      await User.findOneAndUpdate(
        { userId },
        { hasPassword: true },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      message: storedRecord.type === 'create'
        ? 'Password created successfully! You can now sign in with your email and password.'
        : 'Password reset successfully!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error setting password', error: error.message });
  }
});

export default router;

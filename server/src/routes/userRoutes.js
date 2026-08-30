import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';

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
    const { email, fullName, provider, authProvider } = req.query;
    const isGoogle = provider === 'oauth_google' || provider === 'google' || authProvider === 'google';

    let user = await User.findOne({ userId });

    if (!user && email) {
      // Auto-create initial profile document
      user = new User({
        userId,
        email: email.toString().toLowerCase(),
        fullName: fullName ? fullName.toString() : '',
        authProvider: isGoogle ? 'google' : 'email_password',
        isEmailVerified: isGoogle,
        isPhoneVerified: false,
        hasPassword: !isGoogle,
        addresses: []
      });
      await user.save();
    } else if (user) {
      let modified = false;
      if (isGoogle && user.authProvider !== 'google') {
        user.authProvider = 'google';
        user.isEmailVerified = true;
        modified = true;
      } else if (user.authProvider === 'google' && !user.isEmailVerified) {
        user.isEmailVerified = true;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    const isEmailVerified = user.authProvider === 'google' || Boolean(user.isEmailVerified);
    const isPhoneVerified = Boolean(user.isPhoneVerified && user.phone);
    const isVerifiedCustomer = Boolean(isEmailVerified && isPhoneVerified);

    res.json({
      success: true,
      profile: user,
      isEmailVerified,
      isPhoneVerified,
      isVerifiedCustomer
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: 'Error fetching user profile', error: error.message });
  }
});

// POST /api/users/send-phone-otp - Send 6-digit SMS verification code
router.post('/send-phone-otp', async (req, res) => {
  try {
    const { userId, phone } = req.body;
    if (!userId || !phone) {
      return res.status(400).json({ success: false, message: 'User ID and 10-digit mobile number are required.' });
    }

    const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number.' });
    }

    // Check if phone number is already verified by another account
    const existing = await User.findOne({
      phone: { $regex: cleanPhone + '$' },
      isPhoneVerified: true,
      userId: { $ne: userId }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This mobile number is already registered and verified with another customer account.'
      });
    }

    let user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Generate random 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.phone = cleanPhone;
    user.phoneOtp = {
      code: otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
    };
    await user.save();

    console.log(`[SMS OTP Simulator] Sent Phone Verification OTP [${otpCode}] to +91 ${cleanPhone} for user ${userId}`);

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent to +91 ${cleanPhone}.`,
      testOtp: otpCode // returned for instant demo/testing feedback
    });
  } catch (error) {
    console.error('Error sending phone OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send phone verification code.', error: error.message });
  }
});

// POST /api/users/verify-phone-otp - Verify 6-digit SMS verification code
router.post('/verify-phone-otp', async (req, res) => {
  try {
    const { userId, phone, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ success: false, message: 'User ID and 6-digit OTP are required.' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const cleanInputOtp = otp.toString().trim();
    const storedOtp = user.phoneOtp?.code;
    const isExpired = user.phoneOtp?.expiresAt && new Date() > new Date(user.phoneOtp.expiresAt);

    // Accept valid generated OTP or standard test code 123456
    const isValid = (storedOtp && storedOtp === cleanInputOtp && !isExpired) || cleanInputOtp === '123456';

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: isExpired ? 'Verification code has expired. Please request a new code.' : 'Invalid 6-digit verification code. Please check and try again.'
      });
    }

    if (phone) {
      user.phone = phone.toString().replace(/\D/g, '').slice(-10);
    }
    user.isPhoneVerified = true;
    user.phoneOtp = undefined;

    // If Google OAuth, ensure email is verified
    if (user.authProvider === 'google') {
      user.isEmailVerified = true;
    }

    await user.save();

    const isEmailVerified = user.authProvider === 'google' || Boolean(user.isEmailVerified);
    const isVerifiedCustomer = Boolean(isEmailVerified && user.isPhoneVerified);

    res.json({
      success: true,
      message: 'Mobile phone number verified successfully!',
      profile: user,
      isPhoneVerified: true,
      isEmailVerified,
      isVerifiedCustomer
    });
  } catch (error) {
    console.error('Error verifying phone OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to verify phone number.', error: error.message });
  }
});

// POST /api/users/send-email-otp - Send 6-digit Email verification code
router.post('/send-email-otp', async (req, res) => {
  try {
    const { userId, email } = req.body;
    if (!userId || !email) {
      return res.status(400).json({ success: false, message: 'User ID and email address are required.' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailOtp = {
      code: otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };
    await user.save();

    console.log(`[Email OTP Simulator] Sent Email Verification OTP [${otpCode}] to ${email} for user ${userId}`);

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${email}.`,
      testOtp: otpCode
    });
  } catch (error) {
    console.error('Error sending email OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send email verification code.', error: error.message });
  }
});

// POST /api/users/verify-email-otp - Verify 6-digit Email verification code
router.post('/verify-email-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ success: false, message: 'User ID and 6-digit OTP are required.' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const cleanInputOtp = otp.toString().trim();
    const storedOtp = user.emailOtp?.code;
    const isExpired = user.emailOtp?.expiresAt && new Date() > new Date(user.emailOtp.expiresAt);

    const isValid = (storedOtp && storedOtp === cleanInputOtp && !isExpired) || cleanInputOtp === '123456';

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: isExpired ? 'Verification code has expired. Please request a new code.' : 'Invalid 6-digit verification code. Please check and try again.'
      });
    }

    user.isEmailVerified = true;
    user.emailOtp = undefined;
    await user.save();

    const isPhoneVerified = Boolean(user.isPhoneVerified && user.phone);
    const isVerifiedCustomer = Boolean(user.isEmailVerified && isPhoneVerified);

    res.json({
      success: true,
      message: 'Email address verified successfully!',
      profile: user,
      isEmailVerified: true,
      isPhoneVerified,
      isVerifiedCustomer
    });
  } catch (error) {
    console.error('Error verifying email OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to verify email address.', error: error.message });
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

// GET /api/users/merchant-profile/:userId - Retrieve merchant profile
router.get('/merchant-profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, fullName, provider, authProvider } = req.query;
    const isGoogle = provider === 'oauth_google' || provider === 'google' || authProvider === 'google';

    let user = await User.findOne({
      $or: [
        { userId },
        ...(email ? [{ email: email.toString().toLowerCase() }] : [])
      ]
    });

    if (!user && email) {
      // Auto-create initial merchant profile document
      user = new User({
        userId,
        email: email.toString().toLowerCase(),
        fullName: fullName ? fullName.toString() : '',
        authProvider: isGoogle ? 'google' : 'email_password',
        hasPassword: !isGoogle,
        role: 'merchant',
        isMerchant: true,
        onboardingCompleted: false,
        merchantProfile: {
          storeName: fullName ? `${fullName}'s Tech Store` : 'My Tech Store',
          supportEmail: email.toString().toLowerCase(),
          onboardingCompleted: false
        }
      });
      await user.save();
    } else if (user) {
      let modified = false;
      if (isGoogle && user.authProvider !== 'google') {
        user.authProvider = 'google';
        modified = true;
      }
      if (user.userId !== userId && userId && userId !== 'undefined') {
        user.userId = userId;
        modified = true;
      }
      if (!user.isMerchant && user.role === 'merchant') {
        user.isMerchant = true;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    }

    if (!user || (!user.isMerchant && user.role !== 'merchant')) {
      return res.json({
        success: false,
        isMerchant: false,
        message: 'This account is not a registered merchant.'
      });
    }

    res.json({
      success: true,
      merchantProfile: user.merchantProfile,
      isMerchant: true,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching merchant profile', error: error.message });
  }
});

// POST /api/users/merchant-profile/:userId - Save/Update merchant profile & complete onboarding
router.post('/merchant-profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      storeName,
      ownerName,
      fullName,
      gender,
      dateOfBirth,
      phone,
      personalPhone,
      personalAddress,
      addresses,
      businessType,
      category,
      categories,
      gstin,
      businessPhone,
      supportEmail,
      website,
      warehouses,
      onboardingCompleted,
      authProvider,
      email
    } = req.body;

    let user = await User.findOne({
      $or: [
        { userId },
        ...(email ? [{ email: email.toString().toLowerCase() }] : []),
        ...(supportEmail ? [{ email: supportEmail.toString().toLowerCase() }] : [])
      ]
    });

    if (!user) {
      user = new User({
        userId,
        email: (email || supportEmail || '').toLowerCase(),
        fullName: fullName || ownerName || storeName || '',
        isMerchant: true,
        authProvider: authProvider || 'email_password'
      });
    }

    const resolvedName = fullName || ownerName;
    if (resolvedName && resolvedName.trim()) {
      user.fullName = resolvedName.trim();
    }

    if (gender !== undefined) user.gender = gender;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (phone !== undefined || personalPhone !== undefined) {
      const rawPhone = (phone || personalPhone || '').toString().trim();
      user.phone = rawPhone;
    }

    if (authProvider) {
      user.authProvider = authProvider;
    }

    // Handle personal residential address
    if (Array.isArray(addresses) && addresses.length > 0) {
      user.addresses = addresses;
    } else if (personalAddress && personalAddress.street) {
      const addrDoc = {
        label: personalAddress.label || 'Home / Residential',
        recipientName: personalAddress.recipientName || user.fullName || 'Merchant',
        phone: personalAddress.phone || user.phone || '',
        street: personalAddress.street.trim(),
        landmark: personalAddress.landmark ? personalAddress.landmark.trim() : '',
        city: personalAddress.city.trim(),
        state: personalAddress.state.trim(),
        postalCode: personalAddress.postalCode.trim(),
        country: personalAddress.country || 'India',
        isDefault: true
      };

      if (!user.addresses || user.addresses.length === 0) {
        user.addresses = [addrDoc];
      } else {
        user.addresses[0] = { ...user.addresses[0], ...addrDoc };
      }
    }

    const isDone = onboardingCompleted !== undefined ? Boolean(onboardingCompleted) : true;
    user.isMerchant = true;
    user.role = 'merchant';
    user.onboardingCompleted = isDone; // <-- Sets top-level onboardingCompleted!
    user.merchantProfile = {
      storeName: storeName !== undefined ? storeName : (user.merchantProfile?.storeName || ''),
      businessType: businessType !== undefined ? businessType : (user.merchantProfile?.businessType || ''),
      category: category !== undefined ? category : (user.merchantProfile?.category || ''),
      categories: categories !== undefined ? categories : (user.merchantProfile?.categories || (category ? [category] : [])),
      gstin: gstin !== undefined ? gstin.trim().toUpperCase() : (user.merchantProfile?.gstin || ''),
      businessPhone: businessPhone !== undefined ? businessPhone : (user.merchantProfile?.businessPhone || ''),
      supportEmail: supportEmail !== undefined ? supportEmail.toLowerCase() : (user.merchantProfile?.supportEmail || user.email),
      website: website !== undefined ? website : (user.merchantProfile?.website || ''),
      warehouses: warehouses && warehouses.length > 0 ? warehouses : (user.merchantProfile?.warehouses || []),
      onboardingCompleted: isDone
    };

    await user.save();

    res.json({
      success: true,
      message: 'Merchant profile updated successfully!',
      merchantProfile: user.merchantProfile,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving merchant profile', error: error.message });
  }
});

// GET /api/users/check-role/:userId - Verify user role and status
router.get('/check-role/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, provider, authProvider } = req.query;
    const isGoogle = provider === 'oauth_google' || provider === 'google' || authProvider === 'google';

    const queries = [];
    if (userId && userId !== 'undefined' && userId !== 'null') {
      queries.push({ userId });
    }
    if (email && email !== 'undefined' && email !== 'null') {
      queries.push({ email: email.toString().toLowerCase() });
      queries.push({ email: { $regex: new RegExp(`^${email.toString().trim()}$`, 'i') } });
    }

    let user = null;
    if (queries.length > 0) {
      user = await User.findOne({ $or: queries });
    }

    if (!user) {
      return res.json({
        exists: false,
        isNewUser: true,
        role: 'new',
        isMerchant: false,
        isCustomer: false,
        isActive: true,
        onboardingCompleted: false,
        merchantOnboardingCompleted: false
      });
    }

    // If signed in with Google, ensure authProvider reflects in DB
    if (isGoogle && user.authProvider !== 'google') {
      user.authProvider = 'google';
      await user.save();
    }

    const isMerchantUser = user.isMerchant === true || user.role === 'merchant';
    const isCustomerUser = !isMerchantUser;

    res.json({
      exists: true,
      isNewUser: false,
      role: isMerchantUser ? 'merchant' : 'user',
      isMerchant: isMerchantUser,
      isCustomer: isCustomerUser,
      isActive: user.isActive !== false,
      onboardingCompleted: !!user.onboardingCompleted,
      merchantOnboardingCompleted: !!user.merchantProfile?.onboardingCompleted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error checking user role', error: error.message });
  }
});

// POST /api/users/enforce-portal-guard - Prevent accidental cross-portal sign-ins
router.post('/enforce-portal-guard', async (req, res) => {
  try {
    const { userId, email, portal } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    const queries = [];
    if (userId && userId !== 'undefined' && userId !== 'null') {
      queries.push({ userId });
    }
    if (cleanEmail) {
      queries.push({ email: cleanEmail });
      queries.push({ email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });
    }

    let user = null;
    if (queries.length > 0) {
      user = await User.findOne({ $or: queries });
    }

    if (!user) {
      return res.json({ allowed: true });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        allowed: false,
        message: 'This account has been deactivated. Please contact support if this is an error.'
      });
    }

    const isMerchantUser = user.isMerchant === true || user.role === 'merchant';

    if (portal === 'customer') {
      if (isMerchantUser) {
        return res.status(403).json({
          allowed: false,
          userType: 'merchant',
          message: 'This action is not possible. This account is registered as a Merchant. Please sign in via the Merchant Portal.',
          redirect: '/merchant/sign-in'
        });
      }
    } else if (portal === 'merchant') {
      if (!isMerchantUser) {
        return res.status(403).json({
          allowed: false,
          userType: 'customer',
          message: 'This action is not possible. This account is registered as a Customer. Customer accounts cannot sign in to the Merchant Portal.',
          redirect: '/sign-in'
        });
      }
    }

    res.json({ allowed: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error enforcing portal guard', error: error.message });
  }
});

// POST /api/users/deactivate-customer/:userId - Permanently deactivate Customer Account (Danger Zone)
router.post('/deactivate-customer/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Delete user profile and clean up
    await User.deleteOne({ userId });

    res.json({
      success: true,
      message: 'Your NexVolt account and personal data have been completely deleted.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deactivating customer account', error: error.message });
  }
});

// POST /api/users/deactivate-merchant/:userId - Completely deactivate Merchant Store & Delete All Products (Danger Zone)
router.post('/deactivate-merchant/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Merchant account not found.' });
    }

    // Permanently remove all products listed by this merchant from the marketplace
    const productDeleteResult = await Product.deleteMany({
      $or: [
        { merchantId: userId },
        ...(user.email ? [{ merchantEmail: user.email.toLowerCase() }] : [])
      ]
    });

    console.log(`[Merchant Deactivation] Permanently removed ${productDeleteResult.deletedCount} products for merchant ${userId}`);

    user.isMerchant = false;
    user.role = 'user';
    user.onboardingCompleted = false;
    user.merchantProfile = undefined;
    await user.save();

    res.json({
      success: true,
      deletedProductsCount: productDeleteResult.deletedCount,
      message: `Your Merchant Storefront has been deactivated and all ${productDeleteResult.deletedCount} products have been permanently deleted from NexVolt.`
    });
  } catch (error) {
    console.error('Error deactivating merchant account:', error);
    res.status(500).json({ success: false, message: 'Error deactivating merchant account', error: error.message });
  }
});

export default router;

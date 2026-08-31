import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  FileText,
  Award,
  Lock,
  Headphones,
  X,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import logoImg from '../../assets/nexVolt-logo.png';

type PolicyType = 'warranty' | 'shipping' | 'terms' | 'authenticity' | 'privacy' | 'support' | null;

interface PolicyContent {
  id: PolicyType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  badgeColor: string;
  sections: {
    heading: string;
    text: string;
    points?: string[];
  }[];
  highlightBox?: {
    title: string;
    text: string;
  };
}

const POLICIES: Record<string, PolicyContent> = {
  warranty: {
    id: 'warranty',
    title: 'Warranty & Protection Claims',
    subtitle: '100% Certified Brand Manufacturer Warranty on all products',
    icon: ShieldCheck,
    badge: '100% Manufacturer Backed',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    sections: [
      {
        heading: 'Official Brand Warranty Coverage',
        text: 'Every electronic device purchased on NexVolt comes with official manufacturer warranty (typically 1 to 2 years depending on the brand). The warranty covers all hardware defects and component failures under standard operating conditions.',
        points: [
          'Direct service support at authorized centers (Apple, Sony, Dell, Samsung, Asus, etc.) across India.',
          'Tax invoice downloaded from your Orders section serves as your official proof of purchase.',
          'Registered serial numbers tracked in your NexVolt order history for seamless claims.'
        ]
      },
      {
        heading: 'How to Claim Warranty',
        text: 'You can claim warranty through two convenient routes:',
        points: [
          'Walk-in to any authorized brand service center with your NexVolt printed invoice and original product box.',
          'Contact NexVolt Concierge Support to arrange hassle-free doorstep pickup for brand warranty servicing in eligible metro areas.'
        ]
      }
    ],
    highlightBox: {
      title: 'NexVolt Assurance',
      text: 'If a brand service center rejects a valid warranty claim within 30 days of delivery, NexVolt will arrange an instant replacement or full refund under our Buyer Protection Policy.'
    }
  },
  shipping: {
    id: 'shipping',
    title: 'Shipping, Returns & Refund Policy',
    subtitle: 'Express air delivery and 7-day transparent return protection',
    icon: Truck,
    badge: '7-Day Return Guarantee',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    sections: [
      {
        heading: 'Fast Express Delivery',
        text: 'We partner with premier logistics carriers (Bluedart, Delhivery, Express Air) to deliver flagship electronics safely to your doorstep.',
        points: [
          'Metro Cities: Delivered within 24 to 48 hours.',
          'Rest of India: Delivered within 2 to 4 business days.',
          'Free Express Shipping across all prepaid and standard orders.'
        ]
      },
      {
        heading: '7-Day Replacement & Return Policy',
        text: 'Products eligible for return or replacement within 7 days of delivery in the following cases:',
        points: [
          'Defective or damaged on arrival (DOA).',
          'Incorrect specification, color, or model received.',
          'Physical package seal tampering during transit.'
        ]
      },
      {
        heading: 'Fast Instant Refunds',
        text: 'Once the returned package is inspected at our fulfillment hub, refunds are credited back immediately to your original payment method (UPI / Cards: 24–48 hours, NetBanking: 2–3 business days).'
      }
    ],
    highlightBox: {
      title: 'Secure Transit Packaging',
      text: 'All high-value smartphones, laptops, and drones are shipped in tamper-evident security containers with live GPS tracking.'
    }
  },
  terms: {
    id: 'terms',
    title: 'Terms of Service & Buyer Agreement',
    subtitle: 'Clear, transparent rules governing your shopping experience on NexVolt',
    icon: FileText,
    badge: 'Legal & Compliance',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    sections: [
      {
        heading: '1. Platform Use & Account Security',
        text: 'By registering and shopping on NexVolt, you agree to provide authentic contact and address details. Customer accounts are authenticated securely via Clerk with multi-factor authentication capability.',
        points: [
          'Buyers must be 18 years or older to register an account.',
          'Account credentials and one-time passwords must be kept confidential.'
        ]
      },
      {
        heading: '2. Pricing & Taxation',
        text: 'All product prices displayed on NexVolt are transparent and inclusive of 18% Goods & Services Tax (GST). Itemized GST tax invoices are generated automatically for every confirmed transaction.'
      },
      {
        heading: '3. Verified Merchant Marketplace Standard',
        text: 'Sellers operating on NexVolt undergo mandatory GSTIN verification, brand authorization checks, and rigorous quality audits before listing electronics on our catalog.'
      }
    ],
    highlightBox: {
      title: 'Secure Payments',
      text: 'All online transactions are processed through RBI-approved, PCI-DSS Level 1 compliant gateways (Razorpay) with 256-bit bank-grade encryption.'
    }
  },
  authenticity: {
    id: 'authenticity',
    title: '100% Authenticity Guarantee',
    subtitle: 'Zero tolerance for counterfeit products. Strictly authentic devices.',
    icon: Award,
    badge: 'Genuine Brand Pledge',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    sections: [
      {
        heading: 'Brand-Authorized Sourcing Only',
        text: 'Every smartphone, workstation, camera, and headphone featured on NexVolt is sourced exclusively from official brand manufacturers and authorized national distributors.',
        points: [
          '100% Brand New, factory-sealed units with original serial numbers.',
          'No refurbished, grey-market, or counterfeit items allowed on the catalog.',
          'Full manufacturer warranty valid across all authorized service centers in India.'
        ]
      },
      {
        heading: '200% Money-Back Promise',
        text: 'In the impossible event that you receive a non-genuine item from any merchant on our platform, NexVolt will issue a 200% refund of the item purchase price.'
      }
    ],
    highlightBox: {
      title: 'Multi-Point Quality Check',
      text: 'Merchant inventories are inspected regularly by certified electronics quality engineers to ensure authentic seals and packaging.'
    }
  },
  privacy: {
    id: 'privacy',
    title: 'Privacy & Data Protection Policy',
    subtitle: 'How we safeguard your personal data, payments, and account privacy',
    icon: Lock,
    badge: '256-Bit Encrypted',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    sections: [
      {
        heading: 'Data Collection & Usage',
        text: 'We collect minimal personal data necessary to deliver your orders and personalize your experience (Name, Email, Verified Phone Number, and Delivery Addresses).',
        points: [
          'We NEVER sell, rent, or trade your personal information to third parties or marketing brokers.',
          'Phone numbers are strictly used for delivery coordination and account security OTPs.',
          'Payment card numbers and bank credentials are never stored on NexVolt servers; they are processed directly by PCI-compliant Razorpay.'
        ]
      },
      {
        heading: 'Your Rights & Account Deletion',
        text: 'You have complete control over your account. You can view, modify, or permanently delete your profile, saved addresses, and browsing records at any time from your Profile settings.'
      }
    ],
    highlightBox: {
      title: 'Industry-Standard Encryption',
      text: 'All communications between your browser and NexVolt are secured with TLS 1.3 encryption and enterprise security firewalls.'
    }
  },
  support: {
    id: 'support',
    title: 'Customer Desk & Live Support',
    subtitle: 'Our dedicated tech concierge team is here to assist you 7 days a week',
    icon: Headphones,
    badge: 'Fast Human Assistance',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    sections: [
      {
        heading: 'Contact Channels',
        text: 'Reach out to our customer care team anytime for queries regarding orders, shipments, product guidance, or merchant inquiries:',
        points: [
          'Email Support: support@nexvolt.in (Replies within 2 hours)',
          'Test Helpline: +91 90000 00000 • 9:00 AM – 9:00 PM IST (Mon–Sun)',
          'Merchant Partner Desk: seller-support@nexvolt.in'
        ]
      },
      {
        heading: 'Corporate Headquarters',
        text: 'NexVolt Electronics India Pvt. Ltd.\nBlock C-4, Apex Tech Towers, Anna Salai, T. Nagar,\nChennai, Tamil Nadu – 600017, India.'
      }
    ],
    highlightBox: {
      title: 'Order Status & Tracking',
      text: 'You can track real-time shipment status, live delivery steps, and download invoices directly from your Orders page.'
    }
  }
};

export const Footer: React.FC = () => {
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);

  const currentPolicyData = activePolicy ? POLICIES[activePolicy] : null;

  return (
    <footer className="w-full px-3 sm:px-6 lg:px-8 mt-auto font-poppins">
      {/* Curved Top Footer Card with Signature Glowing Shadow and Glassmorphism */}
      <div className="max-w-7xl mx-auto bg-white/50 backdrop-blur-2xl border-t border-x border-white/70 rounded-t-[36px] sm:rounded-t-[48px] shadow-2xl shadow-blue-500/10 p-6 sm:p-10 pb-8 transition-all duration-300">
        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-10 pb-8 border-b border-slate-200/80 text-slate-600 text-xs">
          {/* Brand summary */}
          <div className="md:col-span-2 space-y-3.5">
            <Link to="/" className="inline-block group">
              <img
                src={logoImg}
                alt="NexVolt Logo"
                className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-102"
              />
            </Link>
            <p className="text-slate-600 text-xs leading-relaxed max-w-sm font-medium">
              NexVolt is India's premier destination for high-performance flagship smartphones, pro creator workstations, audiophile sound, and next-gen smart tech with certified manufacturer warranty and express delivery.
            </p>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-slate-900 font-extrabold text-xs tracking-wider uppercase font-heading">Electronics</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/products?category=Smartphones" className="hover:text-[#0066FF] transition">Flagship Smartphones</Link></li>
              <li><Link to="/products?category=Laptops%20%26%20Computers" className="hover:text-[#0066FF] transition">Laptops & Workstations</Link></li>
              <li><Link to="/products?category=Audio%20%26%20Headphones" className="hover:text-[#0066FF] transition">ANC Headphones & Buds</Link></li>
              <li><Link to="/products?category=Smartwatches%20%26%20Wearables" className="hover:text-[#0066FF] transition">Smartwatches & Fitness</Link></li>
              <li><Link to="/products?category=Gaming%20%26%20VR" className="hover:text-[#0066FF] transition">PS5 & Gaming Hardware</Link></li>
              <li><Link to="/products?category=Cameras%20%26%20Drones" className="hover:text-[#0066FF] transition">4K Drones & Cameras</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="text-slate-900 font-extrabold text-xs tracking-wider uppercase font-heading">Customer Hub</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/orders" className="hover:text-[#0066FF] transition">Track Your Order</Link></li>
              <li><Link to="/wishlist" className="hover:text-[#0066FF] transition">My Saved Wishlist</Link></li>
              <li><Link to="/cart" className="hover:text-[#0066FF] transition">Shopping Bag</Link></li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePolicy('warranty')}
                  className="hover:text-[#0066FF] text-left transition cursor-pointer"
                >
                  Warranty & Claims
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePolicy('shipping')}
                  className="hover:text-[#0066FF] text-left transition cursor-pointer"
                >
                  Shipping & Returns
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePolicy('terms')}
                  className="hover:text-[#0066FF] text-left transition cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>

          {/* Merchant & Company */}
          <div className="space-y-3">
            <h4 className="text-slate-900 font-extrabold text-xs tracking-wider uppercase font-heading">Merchant & Brand</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/merchant/sign-in" className="hover:text-[#0066FF] transition">Seller Hub Login</Link></li>
              <li><Link to="/merchant/sign-up" className="hover:text-[#0066FF] transition">Become a Verified Seller</Link></li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePolicy('authenticity')}
                  className="hover:text-[#0066FF] text-left transition cursor-pointer"
                >
                  Authenticity Guarantee
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePolicy('privacy')}
                  className="hover:text-[#0066FF] text-left transition cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePolicy('support')}
                  className="hover:text-[#0066FF] text-left transition cursor-pointer"
                >
                  Contact Support
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium gap-3">
          <p>© 2026 NexVolt Electronics Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              type="button"
              onClick={() => setActivePolicy('privacy')}
              className="hover:text-slate-800 transition cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActivePolicy('terms')}
              className="hover:text-slate-800 transition cursor-pointer"
            >
              Terms of Use
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActivePolicy('support')}
              className="hover:text-slate-800 transition cursor-pointer"
            >
              Help Desk
            </button>
          </div>
        </div>
      </div>

      {/* Professional UX Policy & Information Modal */}
      {currentPolicyData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-5 sm:p-6 bg-slate-50/90 border-b border-slate-200/80 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center border border-blue-200/80 shadow-xs shrink-0 mt-0.5">
                  <currentPolicyData.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-lg font-black text-slate-900 font-heading">
                      {currentPolicyData.title}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${currentPolicyData.badgeColor}`}>
                      {currentPolicyData.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {currentPolicyData.subtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Content */}
            <div className="p-6 sm:p-7 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
              {currentPolicyData.highlightBox && (
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1">
                  <h4 className="font-bold text-[#0066FF] flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{currentPolicyData.highlightBox.title}</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    {currentPolicyData.highlightBox.text}
                  </p>
                </div>
              )}

              {currentPolicyData.sections.map((section, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 font-heading">
                    {section.heading}
                  </h4>
                  <p className="whitespace-pre-line text-slate-600 font-medium">
                    {section.text}
                  </p>
                  {section.points && section.points.length > 0 && (
                    <ul className="space-y-1.5 pt-1 pl-1">
                      {section.points.map((pt, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2 text-[11px] text-slate-600">
                          <ChevronRight className="w-3.5 h-3.5 text-[#0066FF] shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                <span>NexVolt Trust & Safety</span>
                <span>•</span>
                <span>Verified Standards</span>
              </div>

              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};


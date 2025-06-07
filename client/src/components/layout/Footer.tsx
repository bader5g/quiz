import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import axios from 'axios';
import { Skeleton } from "../ui/skeleton";
import { 
  Twitter, 
  Instagram,
  MessageCircle, 
  Send, 
  Globe 
} from 'lucide-react';

interface FooterLink {
  label: string;
  url: string;
}

interface SocialLinks {
  twitter?: string;
  whatsapp?: string;
  telegram?: string;
  instagram?: string;
}

interface FooterSettings {
  links: FooterLink[];
  socialLinks: SocialLinks;
  copyright: string;
}

export default function Footer() {
  const [footerSettings, setFooterSettings] = useState<FooterSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFooterSettings = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get<FooterSettings>('/api/footer-settings');
        setFooterSettings(response.data);
      } catch (error) {
        console.error('Error fetching footer settings:', error);
        // Fallback to default settings if API fails
        setFooterSettings({
          links: [
            { label: "من نحن", url: "/about" },
            { label: "اتصل بنا", url: "/contact" },
            { label: "سياسة الخصوصية", url: "/privacy" },
            { label: "الشروط والأحكام", url: "/terms" },
            { label: "الأسئلة الشائعة", url: "/faq" },
            { label: "English", url: "/en" }
          ],
          socialLinks: {
            twitter: "https://twitter.com/jaweb",
            whatsapp: "https://wa.me/xxxxx",
            telegram: "https://t.me/jaweb",
            instagram: "https://instagram.com/jaweb"
          },
          copyright: "© 2025 جاوب - جميع الحقوق محفوظة"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFooterSettings();
  }, []);

  // Function to render social media icons
  const renderSocialIcon = (platform: keyof SocialLinks, url?: string) => {
    if (!url) return null;

    let Icon;
    let label;

    switch (platform) {
      case 'twitter':
        Icon = Twitter;
        label = 'Twitter';
        break;
      case 'instagram':
        Icon = Instagram;
        label = 'Instagram';
        break;
      case 'whatsapp':
        Icon = MessageCircle;
        label = 'WhatsApp';
        break;
      case 'telegram':
        Icon = Send;
        label = 'Telegram';
        break;
      default:
        return null;
    }

    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noreferrer" 
        className="hover:text-blue-600 transition-colors"
        aria-label={label}
      >
        <Icon className="h-5 w-5" />
      </a>
    );
  };

  return (
    <footer className="bg-gray-50 text-center text-sm text-gray-600 py-6 mt-12 border-t">
      {isLoading ? (
        <>
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-4 w-16" />
            ))}
          </div>
          <div className="flex justify-center gap-4 mb-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-5 w-5 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-4 w-48 mx-auto" />
        </>
      ) : footerSettings && (
        <>
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            {footerSettings.links && footerSettings.links.map((link) => (
              link.url.startsWith('/') ? (
                <Link key={link.url} href={link.url}>
                  <span className="hover:text-blue-600 hover:underline transition-colors cursor-pointer">
                    {link.label}
                  </span>
                </Link>
              ) : (
                <a 
                  key={link.url} 
                  href={link.url} 
                  className="hover:text-blue-600 hover:underline transition-colors"
                  target={link.url.startsWith('http') ? "_blank" : undefined}
                  rel={link.url.startsWith('http') ? "noreferrer" : undefined}
                >
                  {link.label === "English" ? (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" />
                      {link.label}
                    </span>
                  ) : (
                    link.label
                  )}
                </a>
              )
            ))}
          </div>

          <div className="flex justify-center gap-4 mb-4 text-gray-500">
            {footerSettings.socialLinks && Object.entries(footerSettings.socialLinks).map(([platform, url]) => 
              url ? <div key={platform}>{renderSocialIcon(platform as keyof SocialLinks, url)}</div> : null
            )}
          </div>

          <div className="text-xs text-gray-500">
            {footerSettings.copyright}
          </div>
        </>
      )}
    </footer>
  );
}

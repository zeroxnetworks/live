import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from "firebase/firestore";

export const seedSubscriptions = async () => {
  const seedData = [
    {
      category: "🎬 Entertainment",
      products: [
        { name: "Netflix", originalPrice: 15.99, price: 11.99 },
        { name: "Amazon Prime Video", originalPrice: 8.99, price: 6.74 },
        { name: "Disney+", originalPrice: 13.99, price: 10.49 },
        { name: "Max (HBO Max)", originalPrice: 16.99, price: 12.74 },
        { name: "Hulu", originalPrice: 7.99, price: 5.99 },
        { name: "Apple TV+", originalPrice: 9.99, price: 7.49 },
        { name: "Paramount+", originalPrice: 5.99, price: 4.49 },
        { name: "Peacock", originalPrice: 7.99, price: 5.99 },
        { name: "Crunchyroll", originalPrice: 7.99, price: 5.99 },
        { name: "Shahid VIP", originalPrice: 8.99, price: 6.74 },
        { name: "MUBI", originalPrice: 14.99, price: 11.24 },
        { name: "Discovery+", originalPrice: 4.99, price: 3.74 }
      ]
    },
    {
      category: "🎵 Music",
      products: [
        { name: "Spotify Premium", originalPrice: 11.99, price: 8.99 },
        { name: "YouTube Music Premium", originalPrice: 10.99, price: 8.24 },
        { name: "Apple Music", originalPrice: 10.99, price: 8.24 },
        { name: "Deezer Premium", originalPrice: 11.99, price: 8.99 },
        { name: "TIDAL", originalPrice: 10.99, price: 8.24 },
        { name: "SoundCloud Go+", originalPrice: 9.99, price: 7.49 }
      ]
    },
    {
      category: "🤖 AI Tools",
      products: [
        { name: "ChatGPT Plus", originalPrice: 20.00, price: 15.00 },
        { name: "Claude Pro", originalPrice: 20.00, price: 15.00 },
        { name: "Google AI Pro (Gemini)", originalPrice: 19.99, price: 14.99 },
        { name: "Perplexity Pro", originalPrice: 20.00, price: 15.00 },
        { name: "Midjourney", originalPrice: 30.00, price: 22.50 },
        { name: "Runway", originalPrice: 15.00, price: 11.25 },
        { name: "Leonardo AI", originalPrice: 12.00, price: 9.00 },
        { name: "ElevenLabs", originalPrice: 22.00, price: 16.50 },
        { name: "Ideogram", originalPrice: 8.00, price: 6.00 },
        { name: "Poe", originalPrice: 20.00, price: 15.00 }
      ]
    },
    {
      category: "🎨 Design & Creativity",
      products: [
        { name: "Canva Pro", originalPrice: 14.99, price: 11.24 },
        { name: "Adobe Creative Cloud", originalPrice: 59.99, price: 44.99 },
        { name: "Adobe Express Premium", originalPrice: 9.99, price: 7.49 },
        { name: "CapCut Pro", originalPrice: 9.99, price: 7.49 },
        { name: "Envato Elements", originalPrice: 16.50, price: 12.38 },
        { name: "Freepik Premium", originalPrice: 12.00, price: 9.00 },
        { name: "Figma Professional", originalPrice: 15.00, price: 11.25 },
        { name: "VistaCreate Pro", originalPrice: 10.00, price: 7.50 }
      ]
    },
    {
      category: "💼 Productivity",
      products: [
        { name: "Microsoft 365", originalPrice: 6.99, price: 5.24 },
        { name: "Google Workspace", originalPrice: 6.00, price: 4.50 },
        { name: "Notion Plus", originalPrice: 10.00, price: 7.50 },
        { name: "Grammarly Premium", originalPrice: 30.00, price: 22.50 },
        { name: "QuillBot Premium", originalPrice: 9.95, price: 7.46 },
        { name: "WPS Office Premium", originalPrice: 3.99, price: 2.99 },
        { name: "Evernote Professional", originalPrice: 17.99, price: 13.49 }
      ]
    },
    {
      category: "☁️ Cloud Storage",
      products: [
        { name: "Google One", originalPrice: 1.99, price: 1.49 },
        { name: "Dropbox Plus", originalPrice: 11.99, price: 8.99 },
        { name: "Microsoft OneDrive", originalPrice: 1.99, price: 1.49 },
        { name: "iCloud+", originalPrice: 0.99, price: 0.74 },
        { name: "MEGA Pro", originalPrice: 4.99, price: 3.74 }
      ]
    },
    {
      category: "🔒 VPN & Security",
      products: [
        { name: "NordVPN", originalPrice: 12.99, price: 9.74 },
        { name: "ExpressVPN", originalPrice: 12.95, price: 9.71 },
        { name: "Surfshark", originalPrice: 10.99, price: 8.24 },
        { name: "Proton VPN", originalPrice: 9.99, price: 7.49 },
        { name: "CyberGhost VPN", originalPrice: 12.99, price: 9.74 },
        { name: "Bitdefender Premium", originalPrice: 6.99, price: 5.24 }
      ]
    },
    {
      category: "📚 Learning",
      products: [
        { name: "Coursera Plus", originalPrice: 59.00, price: 44.25 },
        { name: "Skillshare", originalPrice: 13.99, price: 10.49 },
        { name: "LinkedIn Learning", originalPrice: 19.99, price: 14.99 },
        { name: "MasterClass", originalPrice: 10.00, price: 7.50 },
        { name: "Duolingo Super", originalPrice: 12.99, price: 9.74 }
      ]
    },
    {
      category: "🎮 Gaming",
      products: [
        { name: "Xbox Game Pass", originalPrice: 19.99, price: 14.99 },
        { name: "PlayStation Plus", originalPrice: 9.99, price: 7.49 },
        { name: "Nintendo Switch Online", originalPrice: 3.99, price: 2.99 },
        { name: "EA Play", originalPrice: 5.99, price: 4.49 },
        { name: "Ubisoft+", originalPrice: 17.99, price: 13.49 },
        { name: "GeForce NOW", originalPrice: 9.99, price: 7.49 }
      ]
    },
    {
      category: "💻 Developer Tools",
      products: [
        { name: "GitHub Copilot", originalPrice: 10.00, price: 7.50 },
        { name: "JetBrains All Products Pack", originalPrice: 28.90, price: 21.68 },
        { name: "Vercel Pro", originalPrice: 20.00, price: 15.00 },
        { name: "DigitalOcean", originalPrice: 6.00, price: 4.50 },
        { name: "Render", originalPrice: 7.00, price: 5.25 }
      ]
    },
    {
      category: "📱 Social & Communication",
      products: [
        { name: "Telegram Premium", originalPrice: 4.99, price: 3.74 },
        { name: "Discord Nitro", originalPrice: 9.99, price: 7.49 },
        { name: "LinkedIn Premium", originalPrice: 39.99, price: 29.99 },
        { name: "X Premium", originalPrice: 8.00, price: 6.00 },
        { name: "Snapchat+", originalPrice: 3.99, price: 2.99 }
      ]
    }
  ];

  try {
    for (let i = 0; i < seedData.length; i++) {
      const catData = seedData[i];
      // Check if category already exists
      const catQuery = query(collection(db, "subscription_categories"), where("name", "==", catData.category));
      const catSnap = await getDocs(catQuery);
      let catId = "";
      if (catSnap.empty) {
        const catRef = await addDoc(collection(db, "subscription_categories"), { name: catData.category, sortOrder: i });
        catId = catRef.id;
      } else {
        catId = catSnap.docs[0].id;
      }

      for (const prod of catData.products) {
        // Check if product exists
        const prodQuery = query(collection(db, "subscription_products"), where("name", "==", prod.name));
        const prodSnap = await getDocs(prodQuery);
        const logoMap: Record<string, string> = {
          "Netflix": "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
          "Amazon Prime Video": "https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg",
          "Disney+": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg",
          "Max (HBO Max)": "https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg",
          "Hulu": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg",
          "Apple TV+": "https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg",
          "Spotify Premium": "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg",
          "YouTube Music Premium": "https://upload.wikimedia.org/wikipedia/commons/b/bd/YouTube_Music_Logo.svg",
          "ChatGPT Plus": "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
          "Google One": "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg",
          "NordVPN": "https://upload.wikimedia.org/wikipedia/commons/0/07/NordVPN_Logo.svg",
          "Coursera Plus": "https://upload.wikimedia.org/wikipedia/commons/9/97/Coursera-logo-square.svg",
          "Xbox Game Pass": "https://upload.wikimedia.org/wikipedia/commons/f/f9/Xbox_one_logo.svg",
          "PlayStation Plus": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Playstation_logo_colour.svg",
          "Discord Nitro": "https://cdn.simpleicons.org/discord/5865F2",
          "Telegram Premium": "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg"
        };
        const newLogoUrl = logoMap[prod.name] || "";

        if (prodSnap.empty) {
          await addDoc(collection(db, "subscription_products"), {
            categoryId: catId,
            name: prod.name,
            description: `Get instant access to ${prod.name} premium features. Fast delivery and 100% genuine account.`,
            features: ["Full Premium Access", "Instant Delivery", "24/7 Support", "Secure Private Account"],
            duration: "1 Month",
            originalPrice: prod.originalPrice,
            price: prod.price,
            status: "ACTIVE",
            discountBadge: "25% OFF",
            logoUrl: newLogoUrl,
            bannerUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2000&auto=format&fit=crop",
            createdAt: new Date().toISOString()
          });
        } else {
          // Always update existing document to reflect official base price & 25% discount & fix broken logo
          const docRef = doc(db, "subscription_products", prodSnap.docs[0].id);
          const existingData = prodSnap.docs[0].data();
          const updatePayload: any = {
            originalPrice: prod.originalPrice,
            price: prod.price,
            discountBadge: "25% OFF"
          };
          if (newLogoUrl && (!existingData.logoUrl || existingData.logoUrl.includes("2/28/Max_logo.svg") || existingData.logoUrl.includes("9/98/Discord_logo.svg"))) {
            updatePayload.logoUrl = newLogoUrl;
          }
          await updateDoc(docRef, updatePayload);
        }
      }
    }
    return { success: true };
  } catch (e: any) {
    console.error("Error seeding", e);
    return { success: false, error: e.message };
  }
};

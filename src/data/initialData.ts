import { AppData } from '../types';

export const INITIAL_DATA: AppData = {
  salesAgents: ["คุณสมชาย", "คุณวิภา", "คุณธีรเดช", "คุณกัญญารัตน์"],
  salesProfiles: [
    {
      id: 1,
      nickname: "คุณสมชาย",
      fullName: "สมชาย ใจดี",
      phone: "081-111-2222",
      facebook: "FB: Somchai Auto Isuzu",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Somchai",
      note: "เซลล์ประจำสาขาใหญ่ เชี่ยวชาญ MU-X",
      hidden: false
    },
    {
      id: 2,
      nickname: "คุณวิภา",
      fullName: "วิภา สุขใจ",
      phone: "082-222-3333",
      facebook: "FB: Wipa Isuzu Club",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Wipa",
      note: "เชี่ยวชาญรุ่น 4x4 Offroad และ V-Cross",
      hidden: false
    },
    {
      id: 3,
      nickname: "คุณธีรเดช",
      fullName: "ธีรเดช มั่นคง",
      phone: "089-333-4444",
      facebook: "FB: Teeradech Isuzu Pro",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Teeradech",
      note: "ดูแลกลุ่มลูกค้าเชิงพาณิชย์ รถกระบะบรรทุก",
      hidden: false
    },
    {
      id: 4,
      nickname: "คุณกัญญารัตน์",
      fullName: "กัญญารัตน์ รัตนกูล",
      phone: "086-444-5555",
      facebook: "FB: Kanya Isuzu VIP",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Kanyarat",
      note: "ทีมดูแลลูกค้าจองออนไลน์และเอกสารไฟแนนซ์",
      hidden: false
    }
  ],
  categories: {
    "MU-X": ["Ultimate 4x4", "Elegant 4x2", "Active", "Executive"],
    "4x2": ["Hi-Lander 2-Door", "Hi-Lander 4-Door", "Cab-Chassis Smart", "Spacecab 1.9 Ddi"],
    "4x4": ["V-Cross 2-Door", "V-Cross 4-Door 3.0", "V-Cross 4-Door 1.9"],
    "EVENT": ["Motor Show 2026", "Big Motor Sale", "Roadshow เซ็นทรัล", "Online Facebook Ad"]
  },
  categoryColors: {
    "MU-X": "#ef4444",
    "4x2": "#3b82f6",
    "4x4": "#10b981",
    "EVENT": "#f59e0b"
  },
  statuses: ["PS", "BK", "RS", "CC", "ได้คุย"],
  customers: [
    {
      id: 1,
      contactDate: "2026-07-15",
      entryDateTime: "2026-07-15 10:30:00",
      fbName: "Somsak Jaidee",
      salesAgent: "คุณสมชาย",
      category: "MU-X",
      subCategory: "Ultimate 4x4",
      status: "RS",
      statusHistory: [
        { status: "PS", date: "2026-07-15 10:30:00" },
        { status: "BK", date: "2026-07-16 11:20:00" },
        { status: "RS", date: "2026-07-18 14:00:00" }
      ],
      phone: "081-234-5678",
      image: "",
      followUpResult: "นัดหมายเข้าโชว์รูม ไฟแนนซ์ผ่านฉลุย ส่งมอบรถเรียบร้อย"
    },
    {
      id: 2,
      contactDate: "2026-08-02",
      entryDateTime: "2026-08-02 09:15:00",
      fbName: "กิตติพงษ์ รถซิ่ง",
      salesAgent: "คุณวิภา",
      category: "4x4",
      subCategory: "V-Cross 4-Door 3.0",
      status: "BK",
      statusHistory: [
        { status: "ได้คุย", date: "2026-08-02 09:15:00" },
        { status: "BK", date: "2026-08-05 16:40:00" }
      ],
      phone: "089-876-5432",
      image: "",
      followUpResult: "จองรถในงาน Roadshow รอผลเอกสารไฟแนนซ์เช็คเครดิต"
    },
    {
      id: 3,
      contactDate: "2026-08-10",
      entryDateTime: "2026-08-10 13:45:00",
      fbName: "Apinya S.",
      salesAgent: "คุณสมชาย",
      category: "MU-X",
      subCategory: "Elegant 4x2",
      status: "PS",
      statusHistory: [
        { status: "PS", date: "2026-08-10 13:45:00" }
      ],
      phone: "085-112-9988",
      image: "",
      followUpResult: "สนใจโปรโมชั่นดอกเบี้ยพิเศษ ส่งใบเสนอราคาให้พิจารณาทางแชท"
    },
    {
      id: 4,
      contactDate: "2026-08-18",
      entryDateTime: "2026-08-18 15:20:00",
      fbName: "ชัชวาลย์ รุ่งเรืองขนส่ง",
      salesAgent: "คุณธีรเดช",
      category: "4x2",
      subCategory: "Cab-Chassis Smart",
      status: "RS",
      statusHistory: [
        { status: "ได้คุย", date: "2026-08-18 15:20:00" },
        { status: "BK", date: "2026-08-20 10:00:00" },
        { status: "RS", date: "2026-08-25 09:30:00" }
      ],
      phone: "084-555-1234",
      image: "",
      followUpResult: "ออกรถกระบะตอนเดียวไปต่อตู้ทึบ รับรถเรียบร้อย ประทับใจมาก"
    },
    {
      id: 5,
      contactDate: "2026-09-01",
      entryDateTime: "2026-09-01 11:00:00",
      fbName: "Nattapon VIP",
      salesAgent: "คุณกัญญารัตน์",
      category: "MU-X",
      subCategory: "Executive",
      status: "ได้คุย",
      statusHistory: [
        { status: "ได้คุย", date: "2026-09-01 11:00:00" }
      ],
      phone: "090-999-1122",
      image: "",
      followUpResult: "สอบถามตารางผ่อน 84 งวด นัดหมายเข้ามาดูรถจริงวันเสาร์นี้"
    },
    {
      id: 6,
      contactDate: "2026-09-05",
      entryDateTime: "2026-09-05 14:10:00",
      fbName: "วิทยา ช่างยนต์",
      salesAgent: "คุณวิภา",
      category: "4x4",
      subCategory: "V-Cross 2-Door",
      status: "CC",
      statusHistory: [
        { status: "PS", date: "2026-09-05 14:10:00" },
        { status: "CC", date: "2026-09-08 17:00:00" }
      ],
      phone: "087-333-8899",
      image: "",
      followUpResult: "ลูกค้าแจ้งว่าชะลอการซื้อไว้ก่อนเนื่องจากติดภาระบ้าน"
    }
  ],
  expenses: [
    {
      id: 1,
      month: "2026-07",
      code: "CMP-2607-01",
      name: "ยิงแอดโปรโมชั่น MU-X ปลายฝน",
      category: "MU-X",
      budget: 25000,
      spend: 23450,
      inboxCount: 88,
      link: "https://facebook.com/ads"
    },
    {
      id: 2,
      month: "2026-07",
      code: "CMP-2607-02",
      name: "แอดกระบะ 4x2 ซิ่งจัดเต็ม",
      category: "4x2",
      budget: 18000,
      spend: 19200,
      inboxCount: 65,
      link: "https://facebook.com/ads"
    },
    {
      id: 3,
      month: "2026-08",
      code: "CMP-2608-01",
      name: "แคมเปญ V-Cross 4x4 สายลุย",
      category: "4x4",
      budget: 30000,
      spend: 28500,
      inboxCount: 92,
      link: "https://facebook.com/ads"
    },
    {
      id: 4,
      month: "2026-08",
      code: "CMP-2608-02",
      name: "โรดโชว์เซ็นทรัล และ บูธจัดแสดง",
      category: "EVENT",
      budget: 45000,
      spend: 47200,
      inboxCount: 140,
      link: "https://facebook.com/ads"
    },
    {
      id: 5,
      month: "2026-09",
      code: "CMP-2609-01",
      name: "MU-X ดอกเบี้ยพิเศษ 0.99%",
      category: "MU-X",
      budget: 35000,
      spend: 31200,
      inboxCount: 105,
      link: "https://facebook.com/ads"
    }
  ],
  salesCampaigns: [
    {
      id: 1,
      month: "2026-07",
      salesAgent: "คุณสมชาย",
      campaignName: "เพจสมชาย Isuzu - โปร MU-X ป้ายแดง",
      category: "MU-X",
      budget: 8000,
      spend: 7800,
      inbox: 34
    },
    {
      id: 2,
      month: "2026-08",
      salesAgent: "คุณวิภา",
      campaignName: "เพจวิภา ออฟโรด 4x4 สดผ่อน",
      category: "4x4",
      budget: 9500,
      spend: 9200,
      inbox: 42
    },
    {
      id: 3,
      month: "2026-08",
      salesAgent: "คุณธีรเดช",
      campaignName: "เพจธีรเดช รถคอกเพลาลอยรับจ้าง",
      category: "4x2",
      budget: 6000,
      spend: 6400,
      inbox: 28
    },
    {
      id: 4,
      month: "2026-09",
      salesAgent: "คุณกัญญารัตน์",
      campaignName: "เพจกัญญารัตน์ Isuzu การันตีดอกเบี้ย",
      category: "MU-X",
      budget: 7000,
      spend: 6500,
      inbox: 31
    }
  ],
  users: [
    {
      id: "user-salacms",
      username: "salacms",
      password: "salacms",
      displayName: "ผู้ดูแลระบบหลัก (salacms)",
      role: "superadmin",
      createdAt: "2026-09-01 09:00:00"
    },
    {
      id: "user-admin01",
      username: "admin01",
      password: "password123",
      displayName: "คุณสมศักดิ์ (Admin)",
      role: "admin",
      createdAt: "2026-09-02 10:00:00"
    },
    {
      id: "user-mkt01",
      username: "mkt01",
      password: "password123",
      displayName: "คุณนภัสสร (Marketing)",
      role: "mkt",
      createdAt: "2026-09-03 11:00:00"
    },
    {
      id: "user-sale01",
      username: "sale01",
      password: "password123",
      displayName: "คุณสมชาย (Sales)",
      role: "sales",
      salesNickname: "คุณสมชาย",
      createdAt: "2026-09-04 12:00:00"
    }
  ]
};


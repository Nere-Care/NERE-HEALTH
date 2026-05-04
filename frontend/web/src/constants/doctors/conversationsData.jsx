export const conversations = [
  {
    id: 1,
    name: "Marie Tchoua",
    role: "Patient",
    lastMessage: "I received my test results.",
    time: "09:30",
    unread: 2,
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    files: [
      { type: "image", name: "xray.png", url: "https://via.placeholder.com/400" },
      { type: "pdf", name: "blood-test.pdf", url: "#" },
    ],
    messages: [
      { fromMe: false, text: "Good morning doctor.", time: "09:20" },
      { fromMe: true, text: "Good morning Marie.", time: "09:22" },
      {
        fromMe: false,
        text: "I received my test results.",
        time: "09:30",
        files: [{ type: "image", url: "https://via.placeholder.com/300" }],
      },
    ],
  },

  {
    id: 2,
    name: "Dr Ndzi",
    role: "Doctor", // ✅ corrigé
    specialty: "Cardiologist", // 👉 optionnel (info métier)
    lastMessage: "Need your opinion.",
    time: "08:45",
    unread: 0,
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    messages: [],
    files: [],
  },

  {
    id: 3,
    name: "John Kamga",
    role: "Patient",
    lastMessage: "Thanks doctor.",
    time: "Yesterday",
    unread: 1,
    avatar: "https://randomuser.me/api/portraits/men/41.jpg",
    messages: [],
    files: [],
  },

  {
    id: 4,
    name: "Dr Awa",
    role: "Doctor", // ✅ corrigé
    specialty: "Neurologist",
    lastMessage: "Let’s review scan.",
    time: "Yesterday",
    unread: 0,
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    messages: [],
    files: [],
  },

  {
    id: 5,
    name: "Sarah N.",
    role: "Patient",
    lastMessage: "Appointment confirmed.",
    time: "Mon",
    unread: 0,
    avatar: "https://randomuser.me/api/portraits/women/22.jpg",
    messages: [],
    files: [],
  },

  {
    id: 6,
    name: "Dr Mbarga",
    role: "Doctor", // ✅ corrigé
    specialty: "General Doctor",
    lastMessage: "Check file.",
    time: "Sun",
    unread: 3,
    avatar: "https://randomuser.me/api/portraits/men/12.jpg",
    messages: [],
    files: [],
  },

  {
    id: 7,
    name: "Patient K",
    role: "Patient",
    lastMessage: "Thanks!",
    time: "Fri",
    unread: 0,
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
    messages: [],
    files: [],
  },

  // ✅ NOUVEAU : LABORATOIRE
  {
    id: 8,
    name: "LabCare Center",
    role: "Laboratory",
    lastMessage: "تحالyses disponibles.", // ou "تحالyses available."
    time: "10:15",
    unread: 1,
    avatar: "https://via.placeholder.com/150/00bcd4/ffffff?text=LAB",
    files: [
      { type: "pdf", name: "lab-results.pdf", url: "#" },
    ],
    messages: [
      {
        fromMe: false,
        text: "Your lab results are ready.",
        time: "10:10",
      },
      {
        fromMe: true,
        text: "Thanks, I will check them.",
        time: "10:12",
      },
    ],
  },
];
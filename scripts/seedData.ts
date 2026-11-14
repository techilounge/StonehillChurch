import type {
  Announcement,
  ChurchEvent,
  HomepageSlide,
  Leader,
  Ministry,
  PageContent,
  Resource,
  Sermon,
  SiteSettingDoc,
  YoutubeSettings,
} from "@/types";

type SeedDoc<T> = { id: string; data: Omit<T, "createdAt" | "updatedAt" | "createdBy" | "updatedBy" | "publishedAt"> };

export const homepageSlidesSeed: SeedDoc<HomepageSlide>[] = [
  {
    id: "welcome",
    data: {
      title: "Welcome Home to Stonehill SDA Church",
      subtitle: "A Seventh-day Adventist family worshiping, growing, and serving together in Christ.",
      imageUrl: "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=2400&q=80",
      imageAlt: "Sunrise over a quiet hillside chapel",
      primaryCtaLabel: "Plan Your Visit",
      primaryCtaHref: "/plan-your-visit",
      secondaryCtaLabel: "Watch Live",
      secondaryCtaHref: "/live",
      overlayOpacity: 0.45,
      sortOrder: 0,
      active: true,
      status: "published",
    },
  },
  {
    id: "sabbath-worship",
    data: {
      title: "Sabbath Worship Every Saturday",
      subtitle: "Breakfast Service at 9:00am · Sabbath School at 10:00am · Divine Worship at 11:00am.",
      imageUrl: "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=2400&q=80",
      imageAlt: "Open Bible resting on a wooden pew",
      primaryCtaLabel: "Service Times",
      primaryCtaHref: "/plan-your-visit",
      secondaryCtaLabel: "This Week's Sermon",
      secondaryCtaHref: "/sermons",
      overlayOpacity: 0.5,
      sortOrder: 1,
      active: true,
      status: "published",
    },
  },
  {
    id: "ministries",
    data: {
      title: "Find Your Place to Belong",
      subtitle: "From Adventurers to Adult Sabbath School, every age has a community at Stonehill SDA Church.",
      imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=2400&q=80",
      imageAlt: "Group of friends laughing together outdoors",
      primaryCtaLabel: "Explore Ministries",
      primaryCtaHref: "/ministries",
      secondaryCtaLabel: null,
      secondaryCtaHref: null,
      overlayOpacity: 0.4,
      sortOrder: 2,
      active: true,
      status: "published",
    },
  },
];

export const sermonsSeed: SeedDoc<Sermon>[] = [
  {
    id: "anchored-in-hope",
    data: {
      title: "Anchored in Hope",
      slug: "anchored-in-hope",
      speaker: "Pastor Daniel Reyes",
      sermonDate: "2026-05-02T18:00:00Z",
      scripture: "Hebrews 6:17–20",
      series: "Living Hope",
      description:
        "When the storms of life crash against us, the promise of Jesus is the anchor that holds. Pastor Daniel walks through Hebrews 6 to remind us where our hope is fastened.",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtubeVideoId: "dQw4w9WgXcQ",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      thumbnailAlt: "Anchored in Hope sermon thumbnail",
      featured: true,
      status: "published",
      seoTitle: "Anchored in Hope — Stonehill SDA Sermon",
      seoDescription:
        "Pastor Daniel Reyes preaches from Hebrews 6 on the unshakable hope we have in Jesus Christ.",
    },
  },
  {
    id: "the-sabbath-rest",
    data: {
      title: "The Sabbath Rest We Were Made For",
      slug: "the-sabbath-rest",
      speaker: "Pastor Naomi Whitfield",
      sermonDate: "2026-04-25T18:00:00Z",
      scripture: "Genesis 2:1–3; Mark 2:27",
      series: "Living Hope",
      description:
        "Sabbath is a gift before it is a command. Pastor Naomi opens the creation story to recover the rhythm of holy rest in a hurried world.",
      youtubeUrl: "https://www.youtube.com/watch?v=oHg5SJYRHA0",
      youtubeVideoId: "oHg5SJYRHA0",
      thumbnailUrl: "https://i.ytimg.com/vi/oHg5SJYRHA0/maxresdefault.jpg",
      thumbnailAlt: "Sabbath Rest sermon thumbnail",
      featured: false,
      status: "published",
      seoTitle: "The Sabbath Rest We Were Made For",
      seoDescription:
        "A study from Genesis 2 and Mark 2 on recovering the gift of Sabbath in everyday life.",
    },
  },
  {
    id: "love-bears-all-things",
    data: {
      title: "Love Bears All Things",
      slug: "love-bears-all-things",
      speaker: "Elder Marcus Hadley",
      sermonDate: "2026-04-18T18:00:00Z",
      scripture: "1 Corinthians 13",
      series: null,
      description:
        "Elder Marcus shares from 1 Corinthians 13 about the patient, persevering love that marks the people of God.",
      youtubeUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
      youtubeVideoId: "ScMzIvxBSi4",
      thumbnailUrl: "https://i.ytimg.com/vi/ScMzIvxBSi4/maxresdefault.jpg",
      thumbnailAlt: "Love Bears All Things sermon thumbnail",
      featured: false,
      status: "published",
      seoTitle: "Love Bears All Things — Stonehill SDA",
      seoDescription:
        "A walk through 1 Corinthians 13 on the kind of love that endures everything.",
    },
  },
  {
    id: "behold-the-lamb",
    data: {
      title: "Behold the Lamb",
      slug: "behold-the-lamb",
      speaker: "Pastor Daniel Reyes",
      sermonDate: "2026-04-11T18:00:00Z",
      scripture: "John 1:29–34",
      series: null,
      description:
        "John the Baptist's announcement still echoes today. A communion-Sabbath message on the Lamb who takes away the sin of the world.",
      youtubeUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
      youtubeVideoId: "9bZkp7q19f0",
      thumbnailUrl: "https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg",
      thumbnailAlt: "Behold the Lamb sermon thumbnail",
      featured: false,
      status: "published",
      seoTitle: "Behold the Lamb — Stonehill SDA Communion Service",
      seoDescription:
        "A communion-Sabbath sermon on John 1 and the Lamb who takes away the sin of the world.",
    },
  },
];

export const eventsSeed: SeedDoc<ChurchEvent>[] = [
  {
    id: "spring-prayer-week",
    data: {
      title: "Spring Week of Prayer",
      slug: "spring-week-of-prayer-2026",
      startDateTime: "2026-05-18T00:00:00Z",
      endDateTime: "2026-05-23T03:00:00Z",
      location: "Stonehill Sanctuary",
      description:
        "Six evenings of prayer, testimony, and Spirit-led worship as we ask God to renew our church and community.",
      imageUrl: "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=2000&q=80",
      imageAlt: "Hands folded over an open Bible at sunset",
      registrationUrl: null,
      recurring: false,
      recurrenceRule: null,
      category: "prayer",
      featured: true,
      status: "published",
      seoTitle: "Spring Week of Prayer | Stonehill SDA Church",
      seoDescription:
        "Join Stonehill SDA for six evenings of prayer, worship, and testimony May 17–22, 2026.",
    },
  },
  {
    id: "community-health-fair",
    data: {
      title: "Community Health Fair",
      slug: "community-health-fair-2026",
      startDateTime: "2026-06-07T13:00:00Z",
      endDateTime: "2026-06-07T20:00:00Z",
      location: "Stonehill Fellowship Hall",
      description:
        "Free blood pressure screenings, cooking demos, kids' activities, and resources from local health professionals. All are welcome.",
      imageUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=2000&q=80",
      imageAlt: "Healthy fresh vegetables on a market table",
      registrationUrl: "https://stonehillsda.org/events/health-fair-rsvp",
      recurring: false,
      recurrenceRule: null,
      category: "outreach",
      featured: true,
      status: "published",
      seoTitle: "Community Health Fair | Stonehill SDA",
      seoDescription:
        "A free community wellness day at Stonehill SDA with screenings, cooking demos, and family-friendly activities.",
    },
  },
  {
    id: "pathfinder-campout",
    data: {
      title: "Pathfinder Spring Campout",
      slug: "pathfinder-spring-campout-2026",
      startDateTime: "2026-05-29T22:00:00Z",
      endDateTime: "2026-05-31T22:00:00Z",
      location: "Lake Wenatchee State Park",
      description:
        "A weekend of hiking, honors, and worship with the Stonehill Stoneworks Pathfinder Club. Open to invited guests grades 5–10.",
      imageUrl: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=2000&q=80",
      imageAlt: "Tents pitched in a forest clearing at dusk",
      registrationUrl: "https://stonehillsda.org/pathfinders/campout",
      recurring: false,
      recurrenceRule: null,
      category: "youth",
      featured: false,
      status: "published",
      seoTitle: "Pathfinder Spring Campout 2026",
      seoDescription:
        "Stonehill Stoneworks Pathfinder Club's annual spring camping weekend at Lake Wenatchee.",
    },
  },
  {
    id: "weekly-prayer-meeting",
    data: {
      title: "Wednesday Night Prayer Meeting",
      slug: "wednesday-prayer-meeting",
      startDateTime: "2026-05-13T02:00:00Z",
      endDateTime: "2026-05-13T03:30:00Z",
      location: "Stonehill Chapel (and online)",
      description:
        "A midweek pause to pray for our church family, our community, and the world. Join in person or via the live stream.",
      imageUrl: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=2000&q=80",
      imageAlt: "Candle lit on a quiet wooden table",
      registrationUrl: null,
      recurring: true,
      recurrenceRule: "FREQ=WEEKLY;BYDAY=WE",
      category: "prayer",
      featured: false,
      status: "published",
      seoTitle: "Wednesday Prayer Meeting | Stonehill SDA",
      seoDescription:
        "Midweek prayer at Stonehill SDA every Wednesday at 7:00pm in the chapel and online.",
    },
  },
];

export const ministriesSeed: SeedDoc<Ministry>[] = [
  {
    id: "adventurers",
    data: {
      name: "Adventurers Club",
      slug: "adventurers",
      category: "children",
      shortDescription: "Faith, fun, and friendship for kids ages 4–9 and their families.",
      longDescription:
        "The Stonehill Adventurers Club helps young children explore Jesus through nature, service, and active learning. Families meet twice a month for crafts, songs, and outdoor adventures.",
      leaderName: "Lisa Park",
      leaderEmail: "adventurers@stonehillsda.org",
      meetingTime: "1st & 3rd Sundays · 4:00–5:30pm",
      imageUrl: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1600&q=80",
      imageAlt: "Children laughing on a forest trail",
      ctaLabel: "Join Adventurers",
      ctaHref: "/contact?ministry=adventurers",
      featured: true,
      status: "published",
      sortOrder: 10,
      seoTitle: "Adventurers Club | Stonehill SDA",
      seoDescription:
        "Stonehill SDA Adventurers Club for children ages 4–9 — meeting two Sundays a month.",
    },
  },
  {
    id: "pathfinders",
    data: {
      name: "Stoneworks Pathfinders",
      slug: "pathfinders",
      category: "youth",
      shortDescription: "Service, leadership, and adventure for grades 5–10.",
      longDescription:
        "Pathfinders earn honors, serve the community, and grow as disciples. The Stoneworks Club meets weekly during the school year and runs camping and service trips year-round.",
      leaderName: "Director Jamal Wright",
      leaderEmail: "pathfinders@stonehillsda.org",
      meetingTime: "Sundays · 4:00–6:00pm (Sept–May)",
      imageUrl: "https://images.unsplash.com/photo-1487956382158-bb926046304a?auto=format&fit=crop&w=1600&q=80",
      imageAlt: "Pathfinders hiking with backpacks at sunrise",
      ctaLabel: "Join Pathfinders",
      ctaHref: "/contact?ministry=pathfinders",
      featured: true,
      status: "published",
      sortOrder: 20,
      seoTitle: "Stoneworks Pathfinder Club | Stonehill SDA",
      seoDescription:
        "Adventure, honors, and discipleship for youth grades 5–10 at Stonehill SDA.",
    },
  },
  {
    id: "ay-society",
    data: {
      name: "Adventist Youth Society",
      slug: "adventist-youth",
      category: "youth",
      shortDescription: "High school and young adults pursuing Jesus together.",
      longDescription:
        "AY meets every other Sabbath afternoon for worship, conversation, service projects, and shared meals. We tackle real questions about faith, calling, and life together.",
      leaderName: "Brianna Ortiz",
      leaderEmail: "ay@stonehillsda.org",
      meetingTime: "Alt. Sabbaths · 4:00pm",
      imageUrl: "https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1600&q=80",
      imageAlt: "Group of young adults talking around a campfire",
      ctaLabel: "Connect with AY",
      ctaHref: "/contact?ministry=ay",
      featured: false,
      status: "published",
      sortOrder: 30,
      seoTitle: "Adventist Youth Society | Stonehill SDA",
      seoDescription:
        "Stonehill SDA Adventist Youth Society — community, worship, and service for high schoolers and young adults.",
    },
  },
  {
    id: "sabbath-school",
    data: {
      name: "Adult Sabbath School",
      slug: "adult-sabbath-school",
      category: "education",
      shortDescription: "Studying Scripture together every Sabbath morning.",
      longDescription:
        "Six classes meet at 9:30am for prayer, study, and conversation around the quarterly lesson. Visitors are always welcome — no prep required.",
      leaderName: "Superintendent Carla Nguyen",
      leaderEmail: "sabbathschool@stonehillsda.org",
      meetingTime: "Sabbaths · 9:30am",
      imageUrl: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1600&q=80",
      imageAlt: "Open Bible and notebook on a table",
      ctaLabel: "See Class Options",
      ctaHref: "/ministries#sabbath-school",
      featured: false,
      status: "published",
      sortOrder: 40,
      seoTitle: "Adult Sabbath School | Stonehill SDA",
      seoDescription:
        "Six adult Sabbath School classes meet every Sabbath at Stonehill SDA at 10:00am.",
    },
  },
  {
    id: "music-ministry",
    data: {
      name: "Music Ministry",
      slug: "music-ministry",
      category: "worship",
      shortDescription: "Choir, praise team, and instrumentalists leading worship.",
      longDescription:
        "Stonehill's music ministry weaves together choir, praise team, orchestra, and special features. Auditions are open, and beginner-friendly seasonal teams meet for Christmas and Easter programs.",
      leaderName: "Music Director Aiden Cole",
      leaderEmail: "music@stonehillsda.org",
      meetingTime: "Choir: Thursdays 7:00pm · Praise team: Fridays 6:30pm",
      imageUrl: "https://images.unsplash.com/photo-1525824236856-8c0a31dfe3be?auto=format&fit=crop&w=1600&q=80",
      imageAlt: "Choir singing together in worship",
      ctaLabel: "Join the Music Team",
      ctaHref: "/contact?ministry=music",
      featured: false,
      status: "published",
      sortOrder: 50,
      seoTitle: "Music Ministry | Stonehill SDA",
      seoDescription:
        "Choir, praise team, and instrumental musicians serving worship at Stonehill SDA.",
    },
  },
  {
    id: "community-services",
    data: {
      name: "Community Services",
      slug: "community-services",
      category: "outreach",
      shortDescription: "Food pantry and clothing closet serving our neighbors.",
      longDescription:
        "Open every second Tuesday for clothing distribution and weekly for food assistance. Volunteers pack boxes, drive deliveries, and pray with each guest who visits.",
      leaderName: "Coordinator Helena Brooks",
      leaderEmail: "community@stonehillsda.org",
      meetingTime: "Volunteer shifts: Tuesdays 9:00am–1:00pm",
      imageUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1600&q=80",
      imageAlt: "Volunteers packing food boxes for the community",
      ctaLabel: "Volunteer with Us",
      ctaHref: "/volunteer",
      featured: true,
      status: "published",
      sortOrder: 60,
      seoTitle: "Community Services | Stonehill SDA",
      seoDescription:
        "Food pantry, clothing closet, and neighbor-to-neighbor care from Stonehill SDA Community Services.",
    },
  },
  {
    id: "health-ministry",
    data: {
      name: "Health Ministry",
      slug: "health-ministry",
      category: "health",
      shortDescription: "Whole-person wellness rooted in the Adventist health message.",
      longDescription:
        "Cooking classes, walking groups, smoking cessation clinics, and seasonal CHIP cohorts. We believe Christ came that we might have life — and have it more abundantly.",
      leaderName: "Dr. Renee Fitzgerald",
      leaderEmail: "health@stonehillsda.org",
      meetingTime: "See seasonal calendar",
      imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1600&q=80",
      imageAlt: "Bowls of vibrant fresh fruit",
      ctaLabel: "View Health Programs",
      ctaHref: "/ministries#health",
      featured: false,
      status: "published",
      sortOrder: 70,
      seoTitle: "Health Ministry | Stonehill SDA",
      seoDescription:
        "Whole-person wellness programs at Stonehill SDA — cooking classes, walking groups, CHIP cohorts and more.",
    },
  },
];

export const leadersSeed: SeedDoc<Leader>[] = [
  {
    id: "daniel-reyes",
    data: {
      name: "Pastor Daniel Reyes",
      title: "Senior Pastor",
      photoUrl: "https://images.unsplash.com/photo-1545167622-3a6ac756afa4?auto=format&fit=crop&w=800&q=80",
      photoAlt: "Pastor Daniel Reyes smiling outdoors",
      bio: "Pastor Daniel has served Stonehill since 2019 after pastoral assignments in Portland and Boise. He and his wife Marisol have two daughters and love hiking the Cascades together.",
      email: "pastor.daniel@stonehillsda.org",
      sortOrder: 10,
      active: true,
    },
  },
  {
    id: "naomi-whitfield",
    data: {
      name: "Pastor Naomi Whitfield",
      title: "Associate Pastor — Discipleship",
      photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
      photoAlt: "Pastor Naomi Whitfield",
      bio: "Pastor Naomi leads small groups, baptismal preparation, and women's ministries. She is a graduate of Walla Walla University and serves on the Upper Columbia Conference discipleship council.",
      email: "pastor.naomi@stonehillsda.org",
      sortOrder: 20,
      active: true,
    },
  },
  {
    id: "marcus-hadley",
    data: {
      name: "Marcus Hadley",
      title: "Head Elder",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
      photoAlt: "Marcus Hadley",
      bio: "Marcus has served as an elder at Stonehill for twelve years and coordinates the platform team and visitation ministry.",
      email: "head.elder@stonehillsda.org",
      sortOrder: 30,
      active: true,
    },
  },
  {
    id: "amelia-tan",
    data: {
      name: "Amelia Tan",
      title: "Treasurer",
      photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80",
      photoAlt: "Amelia Tan",
      bio: "Amelia stewards Stonehill's finances and partners with ministry leaders to plan budgets that reflect our shared mission.",
      email: "treasurer@stonehillsda.org",
      sortOrder: 40,
      active: true,
    },
  },
  {
    id: "jamal-wright",
    data: {
      name: "Jamal Wright",
      title: "Youth & Pathfinder Director",
      photoUrl: "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=800&q=80",
      photoAlt: "Jamal Wright",
      bio: "Jamal directs Stoneworks Pathfinders and the Adventist Youth Society. A former camp pastor, he loves rock climbing and discipling teens.",
      email: "youth.director@stonehillsda.org",
      sortOrder: 50,
      active: true,
    },
  },
];

export const announcementsSeed: SeedDoc<Announcement>[] = [
  {
    id: "potluck-this-sabbath",
    data: {
      title: "Fellowship Potluck this Sabbath",
      slug: "fellowship-potluck-this-sabbath",
      summary: "Join us for a haystack-themed potluck immediately following worship in the fellowship hall.",
      body: "Join us for a haystack-themed potluck immediately following worship in the fellowship hall. Bring a dish to share — visitors always eat free.",
      category: "community",
      startDate: "2026-05-08T00:00:00Z",
      endDate: "2026-05-09T23:59:00Z",
      priority: "normal",
      publishToWebsite: true,
      showInAnnouncementBar: true,
      showOnHomepage: false,
      ctaLabel: "Sign up to bring a dish",
      ctaHref: "/contact?subject=potluck",
      imageUrl: null,
      imageAlt: null,
      status: "published",
      seoTitle: "",
      seoDescription: "",
    },
  },
  {
    id: "vbs-volunteers",
    data: {
      title: "Vacation Bible School Volunteers Needed",
      slug: "vacation-bible-school-volunteers-needed",
      summary: "Stonehill VBS needs crew leaders, kitchen helpers, and station leads for July 13–17.",
      body: "Stonehill VBS runs July 13–17. We need crew leaders, kitchen helpers, and station leads. Training nights begin in June.",
      category: "ministry",
      startDate: "2026-05-01T00:00:00Z",
      endDate: "2026-06-30T23:59:00Z",
      priority: "high",
      publishToWebsite: true,
      showInAnnouncementBar: true,
      showOnHomepage: false,
      ctaLabel: "Volunteer for VBS",
      ctaHref: "/volunteer?event=vbs",
      imageUrl: null,
      imageAlt: null,
      status: "published",
      seoTitle: "",
      seoDescription: "",
    },
  },
];

export const resourcesSeed: SeedDoc<Resource>[] = [
  {
    id: "weekly-bulletin",
    data: {
      title: "Sabbath Bulletin — May 9, 2026",
      slug: "bulletin-2026-05-09",
      category: "bulletin",
      description:
        "This week's worship order, announcements, and prayer list for Sabbath, May 9, 2026.",
      fileUrl: "https://stonehillsda.org/bulletins/2026-05-09.pdf",
      externalUrl: null,
      status: "published",
      seoTitle: "Sabbath Bulletin — May 9, 2026 | Stonehill SDA",
      seoDescription:
        "Download the Stonehill SDA Sabbath bulletin for May 9, 2026.",
    },
  },
  {
    id: "quarterly-lesson",
    data: {
      title: "Adult Sabbath School Lesson — Q2 2026",
      slug: "sabbath-school-lesson-q2-2026",
      category: "study_guide",
      description:
        "Companion guide and discussion questions for the second-quarter 2026 Sabbath School lesson on the book of James.",
      fileUrl: null,
      externalUrl: "https://www.absg.adventist.org",
      status: "published",
      seoTitle: "Q2 2026 Sabbath School Lesson | Stonehill SDA",
      seoDescription:
        "Quarter 2 2026 Adult Sabbath School lesson resources for the book of James.",
    },
  },
  {
    id: "membership-transfer-form",
    data: {
      title: "Membership Transfer Request",
      slug: "membership-transfer",
      category: "form",
      description:
        "Request a transfer of your church membership into or out of Stonehill SDA.",
      fileUrl: null,
      externalUrl: "https://stonehillsda.org/membership-transfer",
      status: "published",
      seoTitle: "Membership Transfer Request | Stonehill SDA",
      seoDescription:
        "Submit a membership transfer request to Stonehill Seventh-day Adventist Church.",
    },
  },
];

export const pagesSeed: SeedDoc<PageContent>[] = [
  {
    id: "home",
    data: {
      title: "Stonehill Seventh-day Adventist Church",
      slug: "home",
      content:
        "<p>Welcome to Stonehill Seventh-day Adventist Church, a family worshiping, growing, and serving together in Christ.</p>",
      sections: [],
      seoTitle: "Stonehill Seventh-day Adventist Church",
      seoDescription:
        "A welcoming Seventh-day Adventist church community worshiping, growing, and serving together in Christ.",
      status: "published",
    },
  },
  {
    id: "about",
    data: {
      title: "About Stonehill SDA Church",
      slug: "about",
      content:
        "<p>Stonehill SDA Church is a Seventh-day Adventist community committed to worship, discipleship, service, and hope in Jesus Christ.</p>",
      sections: [],
      seoTitle: "About Stonehill Seventh-day Adventist Church",
      seoDescription:
        "Learn about the mission, vision, and church family at Stonehill Seventh-day Adventist Church.",
      status: "published",
    },
  },
  {
    id: "our-beliefs",
    data: {
      title: "Our Beliefs",
      slug: "our-beliefs",
      content:
        "<p>We believe the Bible is the inspired Word of God and points every person to salvation and new life in Jesus Christ.</p>",
      sections: [],
      seoTitle: "Our Beliefs | Stonehill Seventh-day Adventist Church",
      seoDescription:
        "Learn about the core Bible-based beliefs of Stonehill Seventh-day Adventist Church.",
      status: "published",
    },
  },
];

export const siteSettingsSeed: SeedDoc<SiteSettingDoc>[] = [
  {
    id: "general.churchName",
    data: {
      key: "general.churchName",
      value: "Stonehill Seventh-day Adventist Church",
      group: "general",
    },
  },
  {
    id: "general.tagline",
    data: {
      key: "general.tagline",
      value: "A family worshiping, growing, and serving together in Christ.",
      group: "general",
    },
  },
  {
    id: "seo.siteUrl",
    data: {
      key: "seo.siteUrl",
      value: "https://stonehillsda.org",
      group: "seo",
    },
  },
  {
    id: "seo.defaultDescription",
    data: {
      key: "seo.defaultDescription",
      value: "A welcoming Seventh-day Adventist church community worshiping, growing, and serving together in Christ.",
      group: "seo",
    },
  },
  {
    id: "seo.defaultImage",
    data: {
      key: "seo.defaultImage",
      value: "/og-default.png",
      group: "seo",
    },
  },
  {
    id: "seo.twitterHandle",
    data: {
      key: "seo.twitterHandle",
      value: "@stonehillsda",
      group: "seo",
    },
  },
  {
    id: "seo.address.street",
    data: {
      key: "seo.address.street",
      value: "1487 Stonehill Ridge Road",
      group: "seo",
    },
  },
  {
    id: "seo.address.city",
    data: {
      key: "seo.address.city",
      value: "Spokane",
      group: "seo",
    },
  },
  {
    id: "seo.address.region",
    data: {
      key: "seo.address.region",
      value: "WA",
      group: "seo",
    },
  },
  {
    id: "seo.address.postalCode",
    data: {
      key: "seo.address.postalCode",
      value: "99203",
      group: "seo",
    },
  },
  {
    id: "seo.address.country",
    data: {
      key: "seo.address.country",
      value: "US",
      group: "seo",
    },
  },
  {
    id: "contact.email",
    data: {
      key: "contact.email",
      value: "office@stonehillsda.org",
      group: "contact",
    },
  },
  {
    id: "contact.phone",
    data: {
      key: "contact.phone",
      value: "+1-509-555-0117",
      group: "contact",
    },
  },
  {
    id: "contact.address",
    data: {
      key: "contact.address",
      value: "1487 Stonehill Ridge Road, Spokane, WA 99203",
      group: "contact",
    },
  },
  {
    id: "service_times.breakfast_service",
    data: {
      key: "service_times.breakfast_service",
      value: "Saturdays · 9:00am",
      group: "service_times",
    },
  },
  {
    id: "service_times.sabbath_school",
    data: {
      key: "service_times.sabbath_school",
      value: "Saturdays · 10:00am",
      group: "service_times",
    },
  },
  {
    id: "service_times.divine_worship",
    data: {
      key: "service_times.divine_worship",
      value: "Saturdays · 11:00am",
      group: "service_times",
    },
  },
  {
    id: "service_times.prayer_meeting",
    data: {
      key: "service_times.prayer_meeting",
      value: "Wednesdays · 7:00pm",
      group: "service_times",
    },
  },
  {
    id: "social.youtube",
    data: {
      key: "social.youtube",
      value: "https://www.youtube.com/@stonehillsda",
      group: "social",
    },
  },
  {
    id: "social.facebook",
    data: {
      key: "social.facebook",
      value: "https://www.facebook.com/stonehillsda",
      group: "social",
    },
  },
  {
    id: "social.instagram",
    data: {
      key: "social.instagram",
      value: "https://www.instagram.com/stonehillsda",
      group: "social",
    },
  },
  {
    id: "giving.url",
    data: {
      key: "giving.url",
      value: "https://adventistgiving.org/donate/AN4ABC",
      group: "giving",
    },
  },
];

export const youtubeSettingsSeed: { id: string; data: Omit<YoutubeSettings, "updatedAt" | "updatedBy"> } = {
  id: "default",
  data: {
    channelId: "",
    channelUrl: "",
    liveStreamUrl: null,
    uploadsPlaylistId: null,
    featuredVideoId: null,
    autoFetchLatestSermons: false,
    showLiveBanner: false,
  },
};

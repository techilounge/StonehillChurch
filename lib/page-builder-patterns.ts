import { PatternTemplate } from "@/types/pageBuilder";

export const patternsCatalog: PatternTemplate[] = [
  {
    id: "pat_hero_home",
    name: "Welcome to Stonehill Home Hero",
    category: "hero",
    description: "Welcome first-time visitors with a clear next step.",
    sections: [
      {
        id: "pat_hero_home_sec1",
        type: "columns",
        layout: "2-col",
        style: {
          padding: "py-16 md:py-24",
          backgroundColor: "#fbfaf6",
          layoutWidth: "content",
          mobileStacking: "stack",
          verticalSpacing: "gap-8"
        },
        columns: [
          {
            id: "col_hero_1",
            width: "1/2",
            blocks: [
              {
                id: "blk_hero_sub",
                type: "heading",
                content: {
                  text: "A place to belong, grow, and serve",
                  level: "h4",
                  alignment: "left"
                },
                style: {
                  textColor: "#e7ab10",
                  fontFamily: "var(--font-handwritten)",
                  fontSize: "text-2xl md:text-3xl"
                }
              },
              {
                id: "blk_hero_title",
                type: "heading",
                content: {
                  text: "Welcome Home to Stonehill Church",
                  level: "h1",
                  alignment: "left"
                },
                style: {
                  textColor: "#1e3f66"
                }
              },
              {
                id: "blk_hero_body",
                type: "paragraph",
                content: {
                  text: "Stonehill Seventh-day Adventist Church is a vibrant, multicultural family united in Christ. Join us this Saturday as we worship, learn, and grow together. Our hearts are open, and there is a place reserved just for you.",
                  alignment: "left"
                }
              },
              {
                id: "blk_hero_spacer",
                type: "spacer",
                content: {
                  height: "1.5rem"
                }
              },
              {
                id: "blk_hero_btn1",
                type: "button",
                content: {
                  text: "Plan Your Visit",
                  url: "/plan-your-visit",
                  variant: "primary",
                  alignment: "left"
                }
              },
              {
                id: "blk_hero_btn2",
                type: "button",
                content: {
                  text: "Watch Online",
                  url: "/sermons",
                  variant: "outline",
                  alignment: "left"
                }
              }
            ]
          },
          {
            id: "col_hero_2",
            width: "1/2",
            blocks: [
              {
                id: "blk_hero_img",
                type: "image",
                content: {
                  url: "/images/hero-welcome.jpg",
                  alt: "Stonehill Church family gathered outdoors laughing and studying the Bible together",
                  caption: "Worshipping together under grace"
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "pat_about_mission",
    name: "Our Vision & Mission Statement",
    category: "about",
    description: "State the vision of local community impact.",
    sections: [
      {
        id: "pat_about_mission_sec1",
        type: "section",
        layout: "1-col",
        style: {
          padding: "py-16 md:py-20",
          backgroundColor: "#ffffff",
          layoutWidth: "content"
        },
        blocks: [
          {
            id: "blk_about_sub",
            type: "heading",
            content: {
              text: "Rooted in scripture, reaching our neighbors",
              level: "h4",
              alignment: "center"
            },
            style: {
              textColor: "#e7ab10",
              fontFamily: "var(--font-handwritten)"
            }
          },
          {
            id: "blk_about_title",
            type: "heading",
            content: {
              text: "Our Vision & Mission",
              level: "h2",
              alignment: "center"
            },
            style: {
              textColor: "#1e3f66"
            }
          },
          {
            id: "blk_about_body",
            type: "paragraph",
            content: {
              text: "At Stonehill, our mission is simple: to reflect Christ's active love, share the everlasting gospel, and build a supportive community that prepares hearts for His soon return. We achieve this through scripture-centered study, sincere fellowship, and practical service to Spring Hill and our surrounding neighborhoods.",
              alignment: "center"
            }
          },
          {
            id: "blk_about_div",
            type: "divider",
            content: {
              style: "solid"
            }
          },
          {
            id: "blk_about_cta",
            type: "cta",
            content: {
              title: "Worship With Us This Sabbath",
              text: "Sabbath School starts at 9:30 AM followed by our Main Worship Service at 11:00 AM. We would be honored to meet you in person.",
              buttonText: "Service Times & Directions",
              buttonUrl: "/plan-your-visit",
              background: "light"
            }
          }
        ]
      }
    ]
  },
  {
    id: "pat_about_pastor",
    name: "Message from Pastor Greg",
    category: "about",
    description: "Add a warm, authentic personal greeting from the Lead Pastor.",
    sections: [
      {
        id: "pat_about_pastor_sec1",
        type: "columns",
        layout: "left-sidebar",
        style: {
          padding: "py-16 md:py-24",
          backgroundColor: "#fbfaf6",
          layoutWidth: "content",
          mobileStacking: "stack"
        },
        columns: [
          {
            id: "col_pastor_img",
            width: "1/3",
            blocks: [
              {
                id: "blk_pastor_photo",
                type: "image",
                content: {
                  url: "/images/pastor-greg.jpg",
                  alt: "Pastor Greg Thompson of Stonehill Seventh-day Adventist Church smiling and holding a Bible"
                }
              }
            ]
          },
          {
            id: "col_pastor_text",
            width: "2/3",
            blocks: [
              {
                id: "blk_pastor_sub",
                type: "heading",
                content: {
                  text: "A warm greeting to you",
                  level: "h4",
                  alignment: "left"
                },
                style: {
                  textColor: "#e7ab10",
                  fontFamily: "var(--font-handwritten)"
                }
              },
              {
                id: "blk_pastor_title",
                type: "heading",
                content: {
                  text: "Welcome to our family!",
                  level: "h2",
                  alignment: "left"
                },
                style: {
                  textColor: "#1e3f66"
                }
              },
              {
                id: "blk_pastor_body",
                type: "paragraph",
                content: {
                  text: "Whether you are just passing through, seeking answers to life's big questions, or looking for a home church to put down roots, I want to personally welcome you to Stonehill. We are a multicultural community bound together by God's radical grace. In our church, your past is accepted, your present is loved, and your future in Christ is celebrated. I'd love to grab a cup of tea and hear your story.",
                  alignment: "left"
                }
              },
              {
                id: "blk_pastor_sig",
                type: "paragraph",
                content: {
                  text: "Grace & Peace,\n**Pastor Greg Thompson**\n*Lead Pastor, Stonehill SDA*",
                  alignment: "left"
                }
              },
              {
                id: "blk_pastor_spacer",
                type: "spacer",
                content: {
                  height: "1rem"
                }
              },
              {
                id: "blk_pastor_btn",
                type: "button",
                content: {
                  text: "Connect with Pastor Greg",
                  url: "/prayer-request",
                  variant: "primary",
                  alignment: "left"
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "pat_cta_visit",
    name: "Plan Your Visit Full CTA",
    category: "call_to_action",
    description: "High-impact banner to drive visit conversions.",
    sections: [
      {
        id: "pat_cta_visit_sec1",
        type: "section",
        layout: "1-col",
        style: {
          padding: "py-12 md:py-16",
          backgroundColor: "#ffffff",
          layoutWidth: "content"
        },
        blocks: [
          {
            id: "blk_full_visit_cta",
            type: "cta",
            content: {
              title: "Worship With Us In Person",
              text: "Worship services begin every Saturday at 11:00 AM. Sabbath School study circles start at 9:30 AM. Join us for friendly fellowship, vibrant music, and deep scriptural study.",
              buttonText: "Plan Your Visit",
              buttonUrl: "/plan-your-visit",
              background: "primary"
            }
          }
        ]
      }
    ]
  },
  {
    id: "pat_feat_ministries",
    name: "Explore Our Ministries Feature",
    category: "feature",
    description: "Display high-quality card grids of church activities.",
    sections: [
      {
        id: "pat_feat_ministries_sec1",
        type: "columns",
        layout: "3-col",
        style: {
          padding: "py-16 md:py-24",
          backgroundColor: "#ffffff",
          layoutWidth: "content",
          mobileStacking: "stack"
        },
        columns: [
          {
            id: "col_min_kids",
            width: "1/3",
            blocks: [
              {
                id: "blk_card_kids",
                type: "card",
                content: {
                  title: "Kids & Family Ministry",
                  text: "Nurturing lasting faith in the hearts of children through engaging, interactive Sabbath School classes, Pathfinders, and fun-filled family worship events.",
                  imageUrl: "/images/ministries-kids.jpg",
                  buttonText: "Learn More",
                  buttonUrl: "/ministries/kids"
                }
              }
            ]
          },
          {
            id: "col_min_youth",
            width: "1/3",
            blocks: [
              {
                id: "blk_card_youth",
                type: "card",
                content: {
                  title: "Youth & Young Adults",
                  text: "A safe, dynamic space for junior high, high school, and college students to ask big questions, build lifelong friendships, and put their faith into action.",
                  imageUrl: "/images/ministries-youth.jpg",
                  buttonText: "Explore Youth",
                  buttonUrl: "/ministries/youth"
                }
              }
            ]
          },
          {
            id: "col_min_community",
            width: "1/3",
            blocks: [
              {
                id: "blk_card_comm",
                type: "card",
                content: {
                  title: "Community Support",
                  text: "Sharing Christ's love in highly practical ways through our weekly food pantry distributions, neighborhood cleanups, and local health check clinics.",
                  imageUrl: "/images/ministries-community.jpg",
                  buttonText: "Get Involved",
                  buttonUrl: "/volunteer"
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "pat_feat_sermon",
    name: "Latest Sermon Media Spotlight",
    category: "feature",
    description: "Display newest sermon series with a video player block.",
    sections: [
      {
        id: "pat_feat_sermon_sec1",
        type: "columns",
        layout: "2-col",
        style: {
          padding: "py-16",
          backgroundColor: "#fbfaf6",
          layoutWidth: "content",
          mobileStacking: "stack"
        },
        columns: [
          {
            id: "col_sermon_desc",
            width: "1/2",
            blocks: [
              {
                id: "blk_sermon_sub",
                type: "heading",
                content: {
                  text: "Worship, learn, and meditate online",
                  level: "h4",
                  alignment: "left"
                },
                style: {
                  textColor: "#e7ab10",
                  fontFamily: "var(--font-handwritten)"
                }
              },
              {
                id: "blk_sermon_title",
                type: "heading",
                content: {
                  text: "Current Sermon Series",
                  level: "h2",
                  alignment: "left"
                },
                style: {
                  textColor: "#1e3f66"
                }
              },
              {
                id: "blk_sermon_body",
                type: "paragraph",
                content: {
                  text: "Missed this Sabbath's sermon or want to re-watch a specific message? Browse through our weekly theological studies. Every message is designed to guide your heart into a deeper relationship with God through sound, scripture-based teaching.",
                  alignment: "left"
                }
              },
              {
                id: "blk_sermon_spacer",
                type: "spacer",
                content: {
                  height: "1rem"
                }
              },
              {
                id: "blk_sermon_btn",
                type: "button",
                content: {
                  text: "Explore Sermon Archive",
                  url: "/sermons",
                  variant: "primary",
                  alignment: "left"
                }
              }
            ]
          },
          {
            id: "col_sermon_video",
            width: "1/2",
            blocks: [
              {
                id: "blk_sermon_player",
                type: "video",
                content: {
                  title: "Current Series: Living in the Light of His Grace",
                  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "pat_feat_event",
    name: "Special Upcoming Event Spotlight",
    category: "feature",
    description: "Showcase a major seasonal church gathering or event.",
    sections: [
      {
        id: "pat_feat_event_sec1",
        type: "columns",
        layout: "2-col",
        style: {
          padding: "py-16",
          backgroundColor: "#ffffff",
          layoutWidth: "content",
          mobileStacking: "stack"
        },
        columns: [
          {
            id: "col_event_img",
            width: "1/2",
            blocks: [
              {
                id: "blk_event_photo",
                type: "image",
                content: {
                  url: "/images/event-promo.jpg",
                  alt: "Stonehill Church community picnic tables lined with fresh fruit and baked breads"
                }
              }
            ]
          },
          {
            id: "col_event_text",
            width: "1/2",
            blocks: [
              {
                id: "blk_event_sub",
                type: "heading",
                content: {
                  text: "Join our next fellowship lunch",
                  level: "h4",
                  alignment: "left"
                },
                style: {
                  textColor: "#e7ab10",
                  fontFamily: "var(--font-handwritten)"
                }
              },
              {
                id: "blk_event_title",
                type: "heading",
                content: {
                  text: "Annual Harvest Fellowship Feast",
                  level: "h2",
                  alignment: "left"
                },
                style: {
                  textColor: "#1e3f66"
                }
              },
              {
                id: "blk_event_body",
                type: "paragraph",
                content: {
                  text: "We invite you and your family to join us immediately following our morning worship service for a completely free Thanksgiving-style feast. Bring your favorite vegetarian dish to share, or just bring yourself! Come and share food, laughter, and encouragement with friends new and old.",
                  alignment: "left"
                }
              },
              {
                id: "blk_event_date",
                type: "iconText",
                content: {
                  icon: "📅",
                  title: "Date & Time",
                  text: "Saturday, November 21 at 12:30 PM",
                  alignment: "left"
                }
              },
              {
                id: "blk_event_loc",
                type: "iconText",
                content: {
                  icon: "📍",
                  title: "Location",
                  text: "Stonehill Fellowship Hall",
                  alignment: "left"
                }
              },
              {
                id: "blk_event_spacer",
                type: "spacer",
                content: {
                  height: "1rem"
                }
              },
              {
                id: "blk_event_btn",
                type: "button",
                content: {
                  text: "RSVP & Save a Seat",
                  url: "/events",
                  variant: "primary",
                  alignment: "left"
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "pat_cta_prayer",
    name: "Prayer Request High-Contrast Banner",
    category: "call_to_action",
    description: "High-impact section driving submissions for pastoral care.",
    sections: [
      {
        id: "pat_cta_prayer_sec1",
        type: "section",
        layout: "1-col",
        style: {
          padding: "py-16 md:py-24",
          backgroundColor: "#1e3f66",
          textColor: "#ffffff",
          layoutWidth: "content"
        },
        blocks: [
          {
            id: "blk_pray_sub",
            type: "heading",
            content: {
              text: "You do not have to carry it alone",
              level: "h4",
              alignment: "center"
            },
            style: {
              textColor: "#e7ab10",
              fontFamily: "var(--font-handwritten)"
            }
          },
          {
            id: "blk_pray_title",
            type: "heading",
            content: {
              text: "How Can We Pray For You?",
              level: "h2",
              alignment: "center"
            },
            style: {
              textColor: "#ffffff"
            }
          },
          {
            id: "blk_pray_body",
            type: "paragraph",
            content: {
              text: "We believe in a God who hears, cares, and answers our prayers. Whether you are facing a medical crisis, a family struggle, a financial challenge, or want to share a note of praise—our pastoral team and local prayer circle are committed to praying over your request.",
              alignment: "center"
            }
          },
          {
            id: "blk_pray_spacer",
            type: "spacer",
            content: {
              height: "1.5rem"
            }
          },
          {
            id: "blk_pray_btn",
            type: "button",
            content: {
              text: "Submit a Prayer Request",
              url: "/prayer-request",
              variant: "secondary",
              alignment: "center"
            }
          }
        ]
      }
    ]
  },
  {
    id: "pat_gen_contact",
    name: "Interactive Church Location & Contact",
    category: "general",
    description: "Display administrative address details alongside exterior photographs.",
    sections: [
      {
        id: "pat_gen_contact_sec1",
        type: "columns",
        layout: "2-col",
        style: {
          padding: "py-16",
          backgroundColor: "#ffffff",
          layoutWidth: "content",
          mobileStacking: "stack"
        },
        columns: [
          {
            id: "col_contact_info",
            width: "1/2",
            blocks: [
              {
                id: "blk_contact_sub",
                type: "heading",
                content: {
                  text: "We would love to hear from you",
                  level: "h4",
                  alignment: "left"
                },
                style: {
                  textColor: "#e7ab10",
                  fontFamily: "var(--font-handwritten)"
                }
              },
              {
                id: "blk_contact_title",
                type: "heading",
                content: {
                  text: "Get In Touch",
                  level: "h2",
                  alignment: "left"
                },
                style: {
                  textColor: "#1e3f66"
                }
              },
              {
                id: "blk_contact_body",
                type: "paragraph",
                content: {
                  text: "Have a question about our weekly services, a theological question, or want to coordinate a meeting? Our administrative team is happy to assist. Call, write, or drop by during the week.",
                  alignment: "left"
                }
              },
              {
                id: "blk_contact_space",
                type: "spacer",
                content: {
                  height: "1rem"
                }
              },
              {
                id: "blk_info_loc",
                type: "iconText",
                content: {
                  icon: "📍",
                  title: "Where to Find Us",
                  text: "123 Stonehill Way, Spring Hill, TN 37174",
                  alignment: "left"
                }
              },
              {
                id: "blk_info_mail",
                type: "iconText",
                content: {
                  icon: "✉️",
                  title: "Email Us",
                  text: "office@stonehillsda.org",
                  alignment: "left"
                }
              },
              {
                id: "blk_info_phone",
                type: "iconText",
                content: {
                  icon: "📞",
                  title: "Call Us",
                  text: "(615) 555-0199",
                  alignment: "left"
                }
              }
            ]
          },
          {
            id: "col_contact_map",
            width: "1/2",
            blocks: [
              {
                id: "blk_contact_image",
                type: "image",
                content: {
                  url: "/images/location-church-front.jpg",
                  alt: "Exterior front entrance view of Stonehill Seventh-day Adventist Church surrounded by lush trees"
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "pat_gen_beliefs",
    name: "Our Core Bible Beliefs",
    category: "general",
    description: "Outline major Adventist beliefs in an easily digestible layout.",
    sections: [
      {
        id: "pat_gen_beliefs_sec1",
        type: "columns",
        layout: "3-col",
        style: {
          padding: "py-16 md:py-24",
          backgroundColor: "#fbfaf6",
          layoutWidth: "content",
          mobileStacking: "stack"
        },
        columns: [
          {
            id: "col_belief_grace",
            width: "1/3",
            blocks: [
              {
                id: "blk_card_grace",
                type: "card",
                content: {
                  title: "Jesus at the Center",
                  text: "We believe salvation is a free gift of grace received through faith in Jesus Christ—our Savior, our Creator, and our soon-coming King.",
                  imageUrl: "/images/beliefs-jesus.jpg",
                  buttonText: "Discover Grace",
                  buttonUrl: "/about"
                }
              }
            ]
          },
          {
            id: "col_belief_bible",
            width: "1/3",
            blocks: [
              {
                id: "blk_card_bible",
                type: "card",
                content: {
                  title: "The Bible as Truth",
                  text: "The Holy Scriptures are the inspired, infallible word of God, serving as our ultimate guide for faith, daily living, and eternal hope.",
                  imageUrl: "/images/beliefs-bible.jpg",
                  buttonText: "Study Scripture",
                  buttonUrl: "/about"
                }
              }
            ]
          },
          {
            id: "col_belief_sabbath",
            width: "1/3",
            blocks: [
              {
                id: "blk_card_sabbath",
                type: "card",
                content: {
                  title: "The Sabbath Gift",
                  text: "We celebrate the biblical seventh-day Sabbath (Saturday) as a holy sanctuary in time, created for rest, fellowship, and worship.",
                  imageUrl: "/images/beliefs-sabbath.jpg",
                  buttonText: "Learn More",
                  buttonUrl: "/about"
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "pat_gen_youth",
    name: "Nurturing the Next Generation",
    category: "general",
    description: "Highlight youth-focused activities (Pathfinders, Sabbath school).",
    sections: [
      {
        id: "pat_gen_youth_sec1",
        type: "columns",
        layout: "2-col",
        style: {
          padding: "py-16 md:py-20",
          backgroundColor: "#ffffff",
          layoutWidth: "content",
          mobileStacking: "stack"
        },
        columns: [
          {
            id: "col_youth_img",
            width: "1/2",
            blocks: [
              {
                id: "blk_youth_photo",
                type: "image",
                content: {
                  url: "/images/youth-campfire.jpg",
                  alt: "Pathfinder camp gather round a blazing fire pit during evening worship under the stars"
                }
              }
            ]
          },
          {
            id: "col_youth_details",
            width: "1/2",
            blocks: [
              {
                id: "blk_youth_sub",
                type: "heading",
                content: {
                  text: "For our kids & teenagers",
                  level: "h4",
                  alignment: "left"
                },
                style: {
                  textColor: "#e7ab10",
                  fontFamily: "var(--font-handwritten)"
                }
              },
              {
                id: "blk_youth_title",
                type: "heading",
                content: {
                  text: "Safe, Fun, & Christ-Centered",
                  level: "h2",
                  alignment: "left"
                },
                style: {
                  textColor: "#1e3f66"
                }
              },
              {
                id: "blk_youth_body",
                type: "paragraph",
                content: {
                  text: "At Stonehill, children and youth are not just the future of our church—they are an active part of our church family today! We offer age-specific classes led by fully background-checked volunteers, active Pathfinder outdoor clubs, and youth worship nights designed to build lasting faith and deep friendships.",
                  alignment: "left"
                }
              },
              {
                id: "blk_youth_school",
                type: "iconText",
                content: {
                  icon: "🦁",
                  title: "Interactive Sabbath School",
                  text: "Tailored Bible lessons for ages 0-18 every Saturday at 9:30 AM.",
                  alignment: "left"
                }
              },
              {
                id: "blk_youth_club",
                type: "iconText",
                content: {
                  icon: "⛺",
                  title: "Pathfinder & Adventurer Clubs",
                  text: "Bible study, community service, outdoor camping, and badge-work honors.",
                  alignment: "left"
                }
              },
              {
                id: "blk_youth_spacer",
                type: "spacer",
                content: {
                  height: "1rem"
                }
              },
              {
                id: "blk_youth_btn",
                type: "button",
                content: {
                  text: "Register for Pathfinders",
                  url: "/volunteer",
                  variant: "primary",
                  alignment: "left"
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "pat_cta_giving",
    name: "Online Giving stewardship Callout",
    category: "call_to_action",
    description: "Drive digital tithes, offerings, and charity donations.",
    sections: [
      {
        id: "pat_cta_giving_sec1",
        type: "section",
        layout: "1-col",
        style: {
          padding: "py-16 md:py-20",
          backgroundColor: "#1c6b8d",
          textColor: "#ffffff",
          layoutWidth: "content"
        },
        blocks: [
          {
            id: "blk_give_sub",
            type: "heading",
            content: {
              text: "Partner with us in ministry",
              level: "h4",
              alignment: "center"
            },
            style: {
              textColor: "#e7ab10",
              fontFamily: "var(--font-handwritten)"
            }
          },
          {
            id: "blk_give_title",
            type: "heading",
            content: {
              text: "Faithful Stewards, Generous Hearts",
              level: "h2",
              alignment: "center"
            },
            style: {
              textColor: "#ffffff"
            }
          },
          {
            id: "blk_give_body",
            type: "paragraph",
            content: {
              text: "Your faithful tithes and offerings directly support our local outreach programs, children's ministries, weekly community food pantry, and worldwide evangelism effort. We invite you to partner with us as we serve our community and spread hope. Giving is secure, simple, and makes an eternal impact.",
              alignment: "center"
            }
          },
          {
            id: "blk_give_spacer",
            type: "spacer",
            content: {
              height: "1.5rem"
            }
          },
          {
            id: "blk_give_btn",
            type: "button",
            content: {
              text: "Give Securely Online",
              url: "/giving",
              variant: "secondary",
              alignment: "center"
            }
          }
        ]
      }
    ]
  }
];

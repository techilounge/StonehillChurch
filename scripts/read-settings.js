const { cert, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const projectId = "stonehill-sda-ch-1723416406673";
const clientEmail = "firebase-adminsdk-fbsvc@stonehill-sda-ch-1723416406673.iam.gserviceaccount.com";
const privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC0qJH1kjoejrc3\n+IDxHryV37AS5ZDazG4gdnbHJECUIWXn3BIddckoec/om/GQ/Uwl0ygGtz3GfQ4e\nI0wPjkDKou0IFak3r2kYZWK8e20u9eXp0H+1mcJqnPsjT/Ve3WD0az+dLXF9BNOk\n9unhqn3xMkLJRz0IwtiXK5xDt8IlrD/XAQpcLts57zd0f3lWaSI3fBNPHDLp4dO7\nnS0GBEjCZaG6Q9TUDLEXKRQPJ2O9FJcDVbqRr4ktC5AD2jTcYZgrVDQJpjgfapQL\nr2icYjQrrBZHErfxr+lcVzwukPOj5rvZNypr2+lcV5khn4BFKYaTmx7v4E1DQ4bF\nctARP7alAgMBAAECggEAKepQjycBuBRJu0E7fXYxsB5JpmDABpvW005ZCaRGHXhQ\nQgbj5xTseqkkjWYdGpRCZiZDS6eZPCPIskJjQ9qv+rPphe4sqEBZBHGFgpCqiPJB\niUm4T8SggIbyl8NV/VAkziDSDiA8jBKiHkyxgAvEE8GjEDsolI9MnGpgY6/PaljU\nHAXTCF7zxdO40NOqZ/BkYkeEBDi83JHB5rXDdXmvTBnYEGNSQ9zY+wa/1X6WsoFe\n95ljL4elO0DX+NHmzLM5op/2mgyaHvKBf9GwM+my1f4m+Tzv5eXV4lCVtrbrhNUl\ntv11UzUMZuSwG21yqj7ahKgx66KtJVSlxIa7DI8ycwKBgQDnFJjzxDPzTtGeAiLi\n0y66DSlDtmwstKtMS6zgrWUlBa4NincJmxxBartSvivhHFzEY+x0y6TIOTKkZPl6\nVVX1DEfg/PMyGqXBVe0NeKNOxJl/6B32NN/NARJlyluTqMQ+Hmfs5TGUSheVtSC7\n/0WnyOjpBvjxP24SSXpUHJaVpwKBgQDII/sXSgEdskTXfJKx6VVjvAyd2bZg4adj\nx3U5YFr5ct85kkaXZegDLzT+sBt0ECVkWOmxX7t+aO6ga3ihKZAl1q9vsiS0sQHu\nJ9hk3FiHaZCFdgO2mnJazHuyd33tAOxr5egk13apJrzrdK9alxCMclh3BHrBBcPX\nx7dExVJy0wKBgQCvdHtCM8qCRmlwwQx+D31eNRoM2NlABJpAHwGPwviWaL6kd2s0\n9vo4TXMYO18T2LYzQ+/JKsreYFesbSLkGSFgI8f78/QwKf2LU9PfM6dD6pDmhnch\ndzoq7VJryX9JGY6P4ARm4guIHc3UlSfattPLtwfpz6p7ev73kaT5co9/5wKBgBNr\nYlatKJSQEpvyC23V3SIzQeojEM4vtwU4ekhZ8BnaKoy0g8L28V81umeoANHvKyGk\nevBqAJBQcC8Cno7MsJ7rSNSGrYcW0cAg/58xvilNdedtPwj9zXC//JShgYd4mngR\ns8e3XF0nVBdomAcrN0DZa3oI5jxKaelLCJ5Uox5fAoGBAIMI7IZ5Cm5Qb1+C8gEs\ngUpbktl6RS/5kob/nAL6pn9d+WUQ8Vrbbli3lA8D4w4YZz2j3Ks1AueCvzGtEKWS\nEfz/52IuHo21po7SrNpoc5UhcLIHRXK9EI9R5kunyI+a5jwMOIn0gHbp8WfX5aX5\nbMJWEvmK4AKAXbTbZ7FHTgcC\n-----END PRIVATE KEY-----\n".replace(/\\n/g, "\n");

const app = initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
  })
});

const db = getFirestore(app);

async function main() {
  const snapshot = await db.collection("youtubeSettings").get();
  snapshot.docs.forEach((doc) => {
    console.log(doc.id, "=>", doc.data());
  });
  process.exit(0);
}

main().catch(console.error);

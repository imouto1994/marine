const fetch = require("node-fetch");
const fsPromises = require("fs/promises");
const fs = require("fs");
const path = require("path");
const url = require("url");

// Read local storage
const localStorageJSON = fs.readFileSync(
  path.join(process.cwd(), "./localStorage.json")
);
const localStorage = JSON.parse(localStorageJSON);
const persistData = JSON.parse(localStorage["persist:topco"]);
const { accessToken, userId } = JSON.parse(persistData.user);

// Read entries
const entriesJSON = fs.readFileSync(path.join(process.cwd(), "./entries.json"));
const entries = JSON.parse(entriesJSON);

async function scrapeEpisode(comicId, index, episode, titleDirPath) {
  console.log(`Downloading episode ${index + 1}...`);
  const verifyResponse = await fetch(
    `https://api.toptoonplus.com/check/isUsableEpisode?comicId=${comicId}&episodeId=${episode.id}&location=viewer&action=view_contents`,
    {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,ja;q=0.6",
        "cache-control": "no-cache",
        deviceid: localStorage.udid,
        language: "en",
        partnercode: "",
        pragma: "no-cache",
        "sec-ch-ua":
          '" Not A;Brand";v="99", "Chromium";v="99", "Google Chrome";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        timestamp: `${Date.now()}`,
        token: accessToken,
        ua: "web",
        "user-id": `${userId}`,
        "x-api-key": "SUPERCOOLAPIKEY2021#@#(",
        "x-origin": "toptoonplus.com",
        Referer: "https://toptoonplus.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      referrer: "https://toptoonplus.com/",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "omit",
    }
  );
  const { data: verifyData } = await verifyResponse.json();

  const viewerResponse = await fetch(
    "https://api.toptoonplus.com/api/v1/page/viewer",
    {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,ja;q=0.6",
        "content-type": "application/json",
        "cache-control": "no-cache",
        deviceid: localStorage.udid,
        language: "en",
        partnercode: "",
        pragma: "no-cache",
        "sec-ch-ua":
          '" Not A;Brand";v="99", "Chromium";v="99", "Google Chrome";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        timestamp: `${Date.now()}`,
        token: accessToken,
        ua: "web",
        "user-id": userId,
        "x-api-key": "SUPERCOOLAPIKEY2021#@#(",
        "x-origin": "toptoonplus.com",
        Referer: "https://toptoonplus.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      referrer: "https://toptoonplus.com/",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: `{"comicId":${comicId},"episodeId":${episode.id},"viewerToken":"${verifyData.viewerToken}","cToken":""}`,
      method: "POST",
      mode: "cors",
      credentials: "omit",
    }
  );
  const { data: viewerData } = await viewerResponse.json();
  const episodeViewerData = viewerData.episode[index];

  // Create  episode dir
  const episodeDirPath = path.resolve(
    titleDirPath,
    `./${String(index + 1).padStart(3, "0")}`
  );
  await fsPromises.mkdir(episodeDirPath, { recursive: true });

  // Download thumbnails
  for (let i = 0; i < episode.thumbnailUrls.length; i++) {
    const thumbnailUrl = episode.thumbnailUrls[i];
    downloadImage(
      thumbnailUrl,
      path.resolve(episodeDirPath, `./thumbnail_${i + 1}.webp`)
    );
  }

  // Download images
  const {
    contentImage: { webp: images },
  } = episodeViewerData;
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    downloadImage(
      image.path,
      path.resolve(episodeDirPath, `./${String(i + 1).padStart(3, "0")}.webp`)
    );
  }
}

async function downloadImage(imageUrl, filePath) {
  const response = await fetch(imageUrl);
  response.body.pipe(fs.createWriteStream(filePath));
}

async function scrapeComic(comicId, startIndex) {
  console.log(`Fetching information for comic with ID ${comicId}...`);

  // Fetch episodes
  const response = await fetch(
    `https://api.toptoonplus.com/api/v1/page/episode?comicId=${comicId}`,
    {
      headers: {
        accept: "*/*",
        "accept-language":
          "en-US,en;q=0.9,th-TH;q=0.8,th;q=0.7,vi-VN;q=0.6,vi;q=0.5,ja-JP;q=0.4,ja;q=0.3",
        "cache-control": "no-cache",
        deviceid: localStorage.udid,
        language: "en",
        partnercode: "",
        pragma: "no-cache",
        "sec-ch-ua":
          '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        timestamp: `${Date.now()}`,
        token: accessToken,
        ua: "web",
        "user-id": userId,
        "x-api-key": "SUPERCOOLAPIKEY2021#@#(",
        "x-origin": "toptoonplus.com",
        Referer: "https://toptoonplus.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      referrer: "https://toptoonplus.com/",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "omit",
    }
  );
  const { data } = await response.json();
  const episodes = data.episode.map((e) => {
    return {
      id: e.episodeId,
      title: e.information.title,
      subtitle: e.information.subTitle,
      thumbnailUrls: e.thumbnailImage.webp.map((image) => image.path),
    };
  });

  // Create title dir
  console.log(
    `Downloading episodes for comic ${data.comic.information.title}...`
  );
  const titleDirPath = path.join(
    process.cwd(),
    `./dist/${data.comic.information.title}`
  );
  await fsPromises.mkdir(titleDirPath, { recursive: true });

  // Scrape episodes
  for (let i = 0; i < episodes.length; i++) {
    if (i < startIndex) {
      continue;
    }
    await scrapeEpisode(comicId, i, episodes[i], titleDirPath);
  }
}

(async () => {
  for (const entry of entries) {
    await scrapeComic(entry.id, entry.startIndex);
  }
})();

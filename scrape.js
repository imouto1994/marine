import fetch from "node-fetch";
import { readFile, mkdir } from "fs/promises";
import { createWriteStream } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localStorageData = JSON.parse(
  await readFile(new URL("./localStorage.json", import.meta.url))
);
const persistData = JSON.parse(localStorageData["persist:topco"]);
const { accessToken, userId } = JSON.parse(persistData.user);

const COMIC_ID = 100123;
const START_INDEX = 0;

async function scrapeEpisode(index, episode, titleDirPath) {
  const verifyResponse = await fetch(
    `https://api.toptoonplus.com/check/isUsableEpisode?comicId=${COMIC_ID}&episodeId=${episode.id}&location=viewer&action=view_contents`,
    {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,ja;q=0.6",
        deviceid: localStorageData.udid,
        language: "en",
        partnercode: "",
        "sec-ch-ua":
          '" Not A;Brand";v="99", "Chromium";v="99", "Google Chrome";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        token: accessToken,
        ua: "web",
        "user-id": `${userId}`,
        "x-api-key": "SUPERCOOLAPIKEY2021#@#(",
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
        deviceid: localStorageData.udid,
        language: "en",
        partnercode: "",
        "sec-ch-ua":
          '" Not A;Brand";v="99", "Chromium";v="99", "Google Chrome";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        token: accessToken,
        ua: "web",
        "user-id": userId,
        "x-api-key": "SUPERCOOLAPIKEY2021#@#(",
      },
      referrer: "https://toptoonplus.com/",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: `{"comicId":${COMIC_ID},"episodeId":${episode.id},"viewerToken":"${verifyData.viewerToken}","cToken":""}`,
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
  await mkdir(episodeDirPath, { recursive: true });

  // Download thumbnails
  for (let i = 0; i < episode.thumbnailUrls.length; i++) {
    const thumbnailUrl = episode.thumbnailUrls[i];
    downloadImage(
      thumbnailUrl,
      path.resolve(episodeDirPath, `./thumbnail_${i + 1}.jpg`)
    );
  }

  // Download images
  const {
    contentImage: { jpeg: images },
  } = episodeViewerData;
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    downloadImage(
      image.path,
      path.resolve(episodeDirPath, `./${String(i + 1).padStart(3, "0")}.jpg`)
    );
  }
}

async function downloadImage(imageUrl, filePath) {
  const response = await fetch(imageUrl);
  response.body.pipe(createWriteStream(filePath));
}

(async () => {
  // Fetch episodes
  const response = await fetch(
    `https://api.toptoonplus.com/api/v1/page/episode?comicId=${COMIC_ID}`
  );
  const { data } = await response.json();
  const episodes = data.episode.map((e) => {
    return {
      id: e.episodeId,
      title: e.information.title,
      subtitle: e.information.subTitle,
      thumbnailUrls: e.thumbnailImage.jpeg.map((image) => image.path),
    };
  });

  // Create title dir
  const titleDirPath = path.resolve(
    __dirname,
    `./dist/${data.comic.information.title}`
  );
  await mkdir(titleDirPath, { recursive: true });

  // Scrape episodes
  for (let i = 0; i < episodes.length; i++) {
    if (i < START_INDEX) {
      continue;
    }
    await scrapeEpisode(i, episodes[i], titleDirPath);
  }
})();

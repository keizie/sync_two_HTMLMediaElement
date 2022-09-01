const express = require('express')
const app = express()
const cache = require('memory-cache')
const ytdl = require('ytdl-core');

app.get('/', (req, res) => res.send('ytb'))
app.get('/yt2', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');

  const { id } = req.query
  const cacheKey = `${id}:v2`;
  console.log(`[${new Date()}] [1/3] request accepted: ${id}`)
  const cached = cache.get(cacheKey)
  if (cached) {
    console.log(`[${new Date()}] [4/3] already cached, return this: ${id}`)
    return res.json(cached)
  }

  try {
    const info = await ytdl.getInfo(id, { quality: ['43', '18', '22'] })
    console.log(`[${new Date()}] [2/3] got info: ${id}`)
    const formats = ytdl.filterFormats(info.formats, 'audioandvideo').sort((a, b) => {
		  if (a.container === 'webm' && b.container !== 'webm') return -1;
			else if (a.container !== 'webm' && b.container === 'webm') return 1;
			return a.audioBitrate - b.audioBitrate;
    });
    const audioBitrates = formats.map(a => a.audioBitrate);
    const widths = formats.map(a => a.width);
    const heights = formats.map(a => a.height);
    const fpss = formats.map(a => a.fps);
    // console.log(audioBitrates, widths, heights);

    const formatsA = ytdl.filterFormats(info.formats, 'audioonly').sort((a, b) => {
		  if (a.container === 'webm' && b.container !== 'webm') return -1;
			else if (a.container !== 'webm' && b.container === 'webm') return 1;
			return a.audioBitrate - b.audioBitrate;
    }).filter((a) => audioBitrates.map(b => a.audioBitrate >= b.audioBitrate).length > 0);
    const formatsV = ytdl.filterFormats(info.formats, 'videoonly').sort((a, b) => {
		  if (a.container === 'webm' && b.container !== 'webm') return -1;
			else if (a.container !== 'webm' && b.container === 'webm') return 1;
        console.log(a.bitrate);
			return a.bitrate - b.bitrate;
    }).filter((a) => widths.includes(a.width) && heights.includes(a.height) && fpss.includes(a.fps));
    console.log(`[${new Date()}] [3/3] choose formats: ${id}`)

    const data = {
        audio: formatsA.at(0)?.url ?? '',
        video: formatsV.at(0)?.url ?? '',
    };
    // console.log(data);
    cache.put(cacheKey, data, 20 * 1e3)
    return res.json(data)
  } catch (e) {
    console.log('['+id+'] exception occured -- ', e.message)
    console.error(e);
    return res.json({ url: null })
  }
})

app.listen(3000, () => console.log('hello'))
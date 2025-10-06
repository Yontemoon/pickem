import * as cheerio from "cheerio"

const main = async () => {
  const response = await fetch("https://www.ufc.com/events")
  const html = await response.text()
  const $ = cheerio.load(html)

  $(".c-card-event--result .c-card-event--result__header").each((index, el) => {
    const link = $(el).find("a").attr("href")

    console.log(link)
  })
}

main()

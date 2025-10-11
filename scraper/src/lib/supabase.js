import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const insertFighter = async ({
  id,
  name,
  tapology_link,
  tapology_img_url,
  ratio,
  tapology_flag_src,
}) => {
  try {
    const { error } = await supabase.from("fighter").upsert(
      {
        id,
        name,
        tapology_link,
        tapology_img_url,
        ratio,
        tapology_flag_src,
      },
      { onConflict: "id" }
    )
    if (error) {
      console.error("Error ocurred inserting fighter.")
      console.error(error)
      throw new Error(error.message)
    }

    console.log(`Successfully inserted ${id}: ${name}`)
  } catch (error) {
    console.error(error)
  }
}

const insertFight = async () => {}

const insertEvent = async ({ id, event_title, date, fights }) => {
  try {
    const { error } = await supabase.from("events").upsert({
      id,
      event_title,
      date,
      fights,
    })

    if (error) {
      console.error("Error ocurred inserting event.")
      console.error(error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error(error)
  }
}

export default supabase
export { insertFighter, insertFight, insertEvent }

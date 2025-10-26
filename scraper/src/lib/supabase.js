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
    return { error: null }
  } catch (error) {
    console.error(error)
    return { error: error }
  }
}

// const insertFight = async () => {}

const insertEvent = async ({ id, event_title, date }) => {
  try {
    const { error } = await supabase.from("events").upsert({
      id,
      event_title,
      date,
    })

    if (error) {
      console.error("Error ocurred inserting event.")
      console.error(error)
      throw new Error(error.message)
    }
    return { error: null }
  } catch (error) {
    console.error(error)
    if (typeof error === "string") {
      return {
        error: error,
      }
    } else {
      return {
        error: "Unexpected error occured inserting event",
      }
    }
  }
}

export default supabase
export { insertFighter, insertEvent }

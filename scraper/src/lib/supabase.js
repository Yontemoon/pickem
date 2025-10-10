import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.SUPABASE_URL
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY

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
    const { error } = await supabase.from("fighter").insert({
      id,
      name,
      tapology_link,
      tapology_img_url,
      ratio,
      tapology_flag_src,
    })
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

export default supabase
export { insertFighter }

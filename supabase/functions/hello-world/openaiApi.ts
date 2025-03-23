import OpenAI from "https://deno.land/x/openai@v4.69.0/mod.ts";

const client = new OpenAI();

export type ActivityStats = {
  athlete: string;
  name: string;
  distance: string;
  time: string;
  elevationGain: string;
  tempo: string;
};

export async function getActivityText(
  { athlete, name, distance, time, elevationGain, tempo }: ActivityStats,
) {
  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.9,
    messages: [
      {
        role: "system",
        content:
          `Vytvoř kraťoučký text oznamující ve Slack kanálu nový běh. Mělo by to být stručné, ale obsahovat jméno běžce, název aktivity, vzdálenost, převýšení, čas a tempo - a zkus to napsat trochu zábavně - jako součást textu si můžeš vymyslet i něco originálního o daném běhu (něco co se přihodilo během běhu, před ním nebo po něm, případně co se běžci honilo hlavou, zkus být občas originální, ale klidně úplně fádní, někdy si ani nic vymýšlet nemusíš...). Údaje k běhu ti poskytne uživatel. Použij všechny údaje, ale název běhu využij jen pro kontext, neuváděj ho doslovně, často bývá vygenerovaný automaticky, občas je v jiném jazyce.

Výstup uveď ve formátu mrkdwn (budu ho postovat přes Slack API do kanálu). Důležité - buď stručný.`,
      },
      {
        role: "user",
        content: `Jméno: ${athlete}
Název běhu: ${name}
Délka: ${distance}
Celkový čas: ${time}
Převýšení: ${elevationGain}
Tempo: ${tempo}`,
      },
    ],
  });

  const result = completion.choices[0]?.message.content;

  if (!result) {
    return `:runner: Nový běh :runner:\n*${athlete} - ${name}*
:arrow_right: ${distance} km    :arrow_up: ${elevationGain} m    :stopwatch: ${time}    :skatepeped: ${tempo}`;
  }
  return result;
}

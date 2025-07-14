<script lang="ts">
  import goldCSVString from "./../assets/gold.csv?raw";
  import { draw } from "svelte/transition";
  import { quintOut, quartInOut } from "svelte/easing";

  const parseCSV = (csvString: string, desiredKeys?: string[]) => {
    const lines = csvString.replace(/^\uFEFF/, "").split("\n");

    const header = lines.shift()!.split(",");

    let keys: string[] = header.reduce((acc: string[], curr: string) => {
      return [
        ...acc,
        curr
          .toLowerCase()
          .replaceAll(" ", "_")
          .replaceAll('"', "")
          .replace(/^\uFEFF/, ""),
      ];
    }, []);

    let result: Record<string, number[]> = {};
    let keyFlags: boolean[] = [];

    if (desiredKeys === undefined) {
      for (const key of keys) {
        result[key] = new Array();
      }

      keyFlags = new Array(keys.length).fill(true);
    } else {
      keyFlags = new Array(keys.length).fill(false);

      for (const key of keys) {
        let idx = desiredKeys.indexOf(key);
        if (idx !== -1) {
          result[key] = new Array();
          keyFlags[idx] = true;
        }
      }
    }

    for (const line of lines) {
      const lineParts = line.split('","').map((str) => str.replaceAll('"', ""));

      let i = 0;
      for (const keyFlag of keyFlags) {
        if (keyFlag) {
          let newValue: string | number | Date = lineParts[i];
          if (keys[i] == "date") {
            newValue = Date.parse(newValue);
          } else {
            newValue = parseFloat(newValue.replaceAll(",", ""));
          }
          result[keys[i]].push(newValue);
        }

        i++;
      }
    }

    return result;
  };

  let goldPriceData = parseCSV(goldCSVString, ["date", "price"]);
  goldPriceData['date'].reverse()
  goldPriceData['price'].reverse()

  console.log(goldPriceData);
</script>

<svg viewBox="0 0 16 9" xmlns="http://www.w3.org/2000/svg">
  <style>
    .label {
      font: italic 13px sans-serif;
    }
    .heavy {
      font: bold 30px sans-serif;
    }
  </style>

  <path
    transition:draw={{ duration: 1500, easing: quartInOut }}
    d={goldPriceData["price"].reduce(
      (acc: { i: number; path: string }, curr: number) => {
        return {
          i: acc.i + 1,
          path: acc.path + `${acc.i > 0 ? ' L ' : ' '}${(acc.i / goldPriceData['price'].length) * 16},${9 - (curr / Math.max(...goldPriceData['price'])) * 9} `,
        };
      },
      { i: 0, path: "M" },
    ).path}
    fill="none"
    stroke="goldenrod"
    stroke-width="0.1px"
  />
</svg>

<div>
  <button>Gold</button>
</div>
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  LogarithmicScale,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
} from "chart.js";
import "chartjs-adapter-date-fns";
import fromUnixTime from "date-fns/fromUnixTime";
import formatDate from "date-fns/format";
import { enUS } from "date-fns/locale";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useMemo, useState } from "react";
import { Chart } from "react-chartjs-2";
import { useDB, useDBQuery } from "../lib/useDb";
ChartJS.register(
  LogarithmicScale,
  CategoryScale,
  PointElement,
  LineElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Title
);

const DEFAULT_HOLDINGS_VALUE = 1;

const Home: NextPage<{ dbBinStr: string }> = ({ dbBinStr }) => {
  const dbBin = useMemo(
    () => (dbBinStr ? (JSON.parse(dbBinStr).data as Uint8Array) : null),
    [dbBinStr]
  );
  const db = useDB(dbBin);
  const [query, _] = useState("SELECT date, price FROM prices;");
  const results = useDBQuery(db, query);
  const [holdingsInputV, setHoldingsInputV] = useState<string>(
    String(DEFAULT_HOLDINGS_VALUE)
  );
  const [holdingsV, setHoldingsV] = useState<number>(DEFAULT_HOLDINGS_VALUE);

  const chartData = useMemo(() => {
    let labels: any[] = [];
    let data: any[] = [];
    if (results !== null) {
      results[0].values.map((v) => {
        const d = fromUnixTime(v[0] as number);
        const p = v[1] as number;
        labels.push(d);
        data.push({ x: d, y: p, holdingsV: p * holdingsV });
      });
    }

    return {
      labels,
      datasets: [
        {
          label: "Price",
          data,
          borderColor: "#f2a900",
          backgroundColor: "#f2a900",
          pointRadius: 0,
        },
      ],
    };
  }, [results, holdingsV]);

  const onHoldingsValueInputChange = (value: string) => {
    setHoldingsInputV(value);
    let n = Number(value);
    if (Number.isNaN(n) === false) {
      setHoldingsV(Number(n.toFixed(8)));
    }
  };

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0,user-scalable=0"
        />
      </Head>
      <div>
        <Head>
          <title>Bitcoin holdings value visualizer</title>
          <meta
            name="description"
            content="Visualize your Bitcoin holdings value over time."
          />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <h1 style={{ color: "white" }}>
            Visualize your Bitcoin holdings value over time
          </h1>
          <input
            style={{ marginTop: "-22px" }}
            type="text"
            value={holdingsInputV}
            onChange={(evt) =>
              onHoldingsValueInputChange(evt.currentTarget.value)
            }
            placeholder="0.00000000 BTC"
          />
        </div>

        <div
          style={{
            display: "flex",
            alignContent: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: "95%" }}>
            <Chart
              // key={generatedHoldingsV}
              data={chartData}
              options={{
                interaction: {
                  mode: "nearest",
                  axis: "x",
                  intersect: false,
                },
                responsive: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: "#222531",
                    callbacks: {
                      title: function (j) {
                        return formatDate(j[0].parsed.x, "MM/dd/yyyy");
                      },
                      label: function (context) {
                        return [
                          `${context.dataset.label}: ${new Intl.NumberFormat(
                            "en-US",
                            {
                              style: "currency",
                              currency: "USD",
                            }
                          ).format(context.parsed.y)}`,
                          `Holdings value ${new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format((context.raw as any).holdingsV as number)}`,
                        ];
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    grid: {
                      color: "#222531",
                    },
                    display: true,
                    type: "time",
                    time: {
                      unit: "year",
                    },
                    adapters: {
                      date: {
                        locale: enUS,
                      },
                    },
                  },
                  y: {
                    grid: {
                      color: "#222531",
                    },
                    display: true,
                    type: "logarithmic",
                    ticks: {
                      color: "#858ca2",
                    },
                  },
                },
              }}
              type="line"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (_) => {
  const fs = require("fs");
  const path = require("path");
  const dbBinPath = path.resolve(process.cwd(), "data.sqlite3");
  let dbBin = fs.readFileSync(dbBinPath) as Buffer;
  return {
    props: {
      dbBinStr: JSON.stringify(dbBin),
    },
  };
};

export default Home;

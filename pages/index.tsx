import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  LogarithmicScale,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
} from "chart.js";
import "chartjs-adapter-date-fns";
import formatDate from "date-fns/format";
import fromUnixTime from "date-fns/fromUnixTime";
import { enUS } from "date-fns/locale";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { Chart } from "react-chartjs-2";
import { QueryExecResult } from "sql.js";
import { useDB, useDBQuery } from "../lib/useDb";

ChartJS.register(
  LogarithmicScale,
  LineController,
  CategoryScale,
  PointElement,
  LineElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Title
);

const DEFAULT_HOLDINGS_AMOUNT_VALUE = 1;

const Home: NextPage<{ dbBinStr: string }> = ({ dbBinStr }) => {
  const dbBin = useMemo(
    () => (dbBinStr ? (JSON.parse(dbBinStr).data as Uint8Array) : null),
    [dbBinStr]
  );
  const db = useDB(dbBin);
  const [query, _] = useState("SELECT date, price FROM prices;");
  const bitcoinPricesData = useDBQuery(db, query);
  const [holdingsAmountV, setHoldingsAmountV] = useState<number>(
    DEFAULT_HOLDINGS_AMOUNT_VALUE
  );

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=1480, minimal-ui, initial-scale=1.0, maximum-scale=1.0,user-scalable=0"
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
            textAlign: "center",
          }}
        >
          <h1 style={{ color: "white", fontSize: "2em" }}>
            Visualize your Bitcoin holdings value over time
          </h1>
          <HoldingsInputField
            currentHoldingsAmountV={holdingsAmountV}
            onChange={(v) => setHoldingsAmountV(v)}
          />
        </div>
        <HoldingsChart
          key={holdingsAmountV}
          bitcoinPricesData={bitcoinPricesData}
          holdingsAmountV={holdingsAmountV}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            textAlign: "center",
            marginTop: "7px",
          }}
        >
          <a
            href="https://github.com/alfonmga/hodlbitcoin.vercel.app"
            target="_blank"
            rel="noreferrer"
          >
            View source code
          </a>
          <p
            style={{
              color: "#c2c2c2",
              fontSize: "11px",
              marginTop: "7px",
            }}
          >
            Did you like it? send me some digital energy{" "}
            <b>bc1qmz0fmcj72fk02lke0002yvh852ctsy38w5mn82</b>
          </p>
        </div>
      </div>
    </>
  );
};
const HoldingsInputField = ({
  currentHoldingsAmountV,
  onChange,
}: {
  currentHoldingsAmountV: number;
  onChange: (value: number) => void;
}) => {
  const [holdingsInputV, setHoldingsInputV] = useState<string>(
    String(currentHoldingsAmountV)
  );
  const [generatedV, setGeneratedV] = useState(currentHoldingsAmountV);
  const onGenerate = () => {
    if (Number.isNaN(holdingsInputV) === false) {
      let n = Number(holdingsInputV);
      if (n > 21000000) {
        alert(
          "Mate, Bitcoin is scarce! There cannot be more than 21MM bitcoins."
        );
        return;
      }
      let nStr = n.toString();
      if (nStr.includes(".") && nStr.split(".")[1].length > 8) {
        alert("Error: One Bitcoin is divisible only to eight decimal places.");
        return;
      }
      setGeneratedV(n);
      onChange(n);
    }
  };
  const isGenerationDisabled =
    holdingsInputV.length === 0 || holdingsInputV === String(generatedV);
  return (
    <>
      <input
        autoFocus
        style={{ marginTop: "-22px" }}
        type="text"
        value={holdingsInputV}
        onChange={(evt) => setHoldingsInputV(evt.currentTarget.value)}
        placeholder="0.00000000 BTC"
        onKeyDown={(e) => {
          if (e.code === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            if (!isGenerationDisabled) {
              onGenerate();
            }
          }
        }}
      />
      <button onClick={onGenerate} disabled={isGenerationDisabled}>
        Generate chart
      </button>
    </>
  );
};
const HoldingsChart = ({
  bitcoinPricesData,
  holdingsAmountV,
}: {
  bitcoinPricesData: QueryExecResult[] | null;
  holdingsAmountV: number;
}) => {
  const chartData = useMemo(() => {
    let labels: any[] = [];
    let data: any[] = [];
    if (bitcoinPricesData !== null) {
      bitcoinPricesData[0].values.map((v) => {
        const d = fromUnixTime(v[0] as number);
        const p = v[1] as number;
        labels.push(d);
        data.push({ x: d, y: holdingsAmountV * p, price: p });
      });
    }

    return {
      labels,
      datasets: [
        {
          label: "Holdings value",
          data,
          borderColor: "#f2a900",
          backgroundColor: "#f2a900",
          pointRadius: 0,
        },
      ],
    };
  }, [bitcoinPricesData, holdingsAmountV]);

  const athValue = useMemo(() => {
    if (!bitcoinPricesData) return null;
    const maxValue = Math.max(...bitcoinPricesData[0].values.map(v => holdingsAmountV * (v[1] as number)));
    return maxValue;
  }, [bitcoinPricesData, holdingsAmountV]);

  return (
    <div
      style={{
        display: "flex",
        alignContent: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      {athValue && (
        <div style={{ 
          marginBottom: "20px", 
          color: "#f2a900",
          fontSize: "1.2em",
          fontWeight: "bold"
        }}>
          All-Time High: {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(athValue)}
        </div>
      )}
      <div style={{ width: "1280px" }}>
        <Chart
          data={chartData}
          options={{
            animation: false,
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
                      `Bitcoin price: ${new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format((context.raw as any).price as number)}`,
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

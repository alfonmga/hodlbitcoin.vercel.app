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
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import fromUnixTime from "date-fns/fromUnixTime";
import { enUS } from "date-fns/locale";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
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

const DEFAULT_HOLDINGS_AMOUNT_VALUE = 1.00000000;

type Currency = 'USD' | 'EUR';

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
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const [eurUsdRate, setEurUsdRate] = useState<number | null>(null);
  const [isZoomEnabled, setIsZoomEnabled] = useState(false);

  useEffect(() => {
    const loadZoomPlugin = async () => {
      const zoomPlugin = (await import('chartjs-plugin-zoom')).default;
      ChartJS.register(zoomPlugin);
      setIsZoomEnabled(true);
    };
    loadZoomPlugin();
  }, []);

  useEffect(() => {
    const fetchEurUsdRate = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur');
        const data = await response.json();
        const usdPrice = data.bitcoin.usd;
        const eurPrice = data.bitcoin.eur;
        setEurUsdRate(eurPrice / usdPrice);
      } catch (error) {
        console.error('Error fetching EUR/USD rate:', error);
      }
    };

    fetchEurUsdRate();
    const interval = setInterval(fetchEurUsdRate, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

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
          <CurrencySelector
            selectedCurrency={selectedCurrency}
            onChange={setSelectedCurrency}
          />
        </div>
        <HoldingsChart
          key={holdingsAmountV}
          bitcoinPricesData={bitcoinPricesData}
          holdingsAmountV={holdingsAmountV}
          selectedCurrency={selectedCurrency}
          eurUsdRate={eurUsdRate}
          isZoomEnabled={isZoomEnabled}
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
    const parsedValue = Number(holdingsInputV);
    if (Number.isNaN(parsedValue)) {
      alert("Invalid input. Falling back to default value of 1 BTC.");
      setHoldingsInputV(DEFAULT_HOLDINGS_AMOUNT_VALUE.toString());
      setGeneratedV(DEFAULT_HOLDINGS_AMOUNT_VALUE)
      onChange(DEFAULT_HOLDINGS_AMOUNT_VALUE)
      return;
    }
    if (parsedValue > 21000000) {
      alert(
        "Mate, Bitcoin is scarce! There cannot be more than 21MM bitcoins."
      );
      return;
    }
    let nStr = parsedValue.toString();
    if (nStr.includes(".") && nStr.split(".")[1].length > 8) {
      alert("Error: One Bitcoin is divisible only to eight decimal places.");
      return;
    }
    setGeneratedV(parsedValue);
    onChange(parsedValue);
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
const CurrencySelector = ({
  selectedCurrency,
  onChange,
}: {
  selectedCurrency: Currency;
  onChange: (currency: Currency) => void;
}) => {
  return (
    <div style={{ marginTop: "10px" }}>
      <select
        value={selectedCurrency}
        onChange={(e) => onChange(e.target.value as Currency)}
        style={{
          padding: "5px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          backgroundColor: "#1a1a1a",
          color: "white",
        }}
      >
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
      </select>
    </div>
  );
};
const HoldingsChart = ({
  bitcoinPricesData,
  holdingsAmountV,
  selectedCurrency,
  eurUsdRate,
  isZoomEnabled,
}: {
  bitcoinPricesData: QueryExecResult[] | null;
  holdingsAmountV: number;
  selectedCurrency: Currency;
  eurUsdRate: number | null;
  isZoomEnabled: boolean;
}) => {
  const chartData = useMemo(() => {
    let labels: any[] = [];
    let data: any[] = [];
    if (bitcoinPricesData !== null) {
      bitcoinPricesData[0].values.map((v) => {
        const d = fromUnixTime(v[0] as number);
        const p = v[1] as number;
        labels.push(d);
        const value = holdingsAmountV * p;
        data.push({ 
          x: d, 
          y: selectedCurrency === 'EUR' && eurUsdRate ? value * eurUsdRate : value,
          price: p 
        });
      });
    }

    return {
      labels,
      datasets: [
        {
          label: `Holdings value`,
          data,
          borderColor: "#f2a900",
          backgroundColor: "#f2a900",
          pointRadius: 0,
        },
      ],
    };
  }, [bitcoinPricesData, holdingsAmountV, selectedCurrency, eurUsdRate]);

  const athValue = useMemo(() => {
    if (!bitcoinPricesData) return null;
    const values = bitcoinPricesData[0].values;
    let maxValue = 0;
    let maxDate = 0;
    
    values.forEach(v => {
      const value = holdingsAmountV * (v[1] as number);
      const finalValue = selectedCurrency === 'EUR' && eurUsdRate ? value * eurUsdRate : value;
      if (finalValue > maxValue) {
        maxValue = finalValue;
        maxDate = v[0] as number;
      }
    });
    
    return { value: maxValue, date: maxDate };
  }, [bitcoinPricesData, holdingsAmountV, selectedCurrency, eurUsdRate]);

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
          All-Time High: {new Intl.NumberFormat(selectedCurrency === 'EUR' ? 'es-ES' : 'en-US', {
            style: "currency",
            currency: selectedCurrency,
          }).format(athValue.value)}{" "}
          <span style={{ 
            color: "#858ca2", 
            fontWeight: "normal",
            fontSize: "0.85em",
            opacity: 0.8
          }}>
            ({formatDate(fromUnixTime(athValue.date), "yyyy-MM-dd")} · {formatDistanceToNow(fromUnixTime(athValue.date), { addSuffix: true })})
          </span>
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
                        selectedCurrency === 'EUR' ? 'es-ES' : 'en-US',
                        {
                          style: "currency",
                          currency: selectedCurrency,
                        }
                      ).format(context.parsed.y)}`,
                      `Bitcoin price: ${new Intl.NumberFormat(
                        selectedCurrency === 'EUR' ? 'es-ES' : 'en-US',
                        {
                          style: "currency",
                          currency: selectedCurrency,
                        }
                      ).format((context.raw as any).price as number)}`,
                    ];
                  },
                },
              },
              ...(isZoomEnabled ? {
                zoom: {
                  zoom: {
                    wheel: {
                      enabled: true,
                      modifierKey: 'ctrl',
                      speed: 0.1
                    },
                    pinch: {
                      enabled: true
                    },
                    mode: 'x',
                    drag: {
                      enabled: true,
                      backgroundColor: 'rgba(242, 169, 0, 0.1)',
                      borderColor: '#f2a900',
                      borderWidth: 1,
                      threshold: 10
                    }
                  },
                  pan: {
                    enabled: true,
                    mode: 'x',
                    modifierKey: 'shift'
                  }
                }
              } : {})
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

import Navbar from "./navbar";
import { Plus } from 'lucide-react';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import CountUp from "./CountUp";
import { useInView } from "motion/react";
import { useRef } from "react";
import { TextAnimate } from "./ui/text-animate";
import { useConnectModal } from "@rainbow-me/rainbowkit"
import DatePicker from "@/components/ui/date-picker";
import { Textarea } from "./ui/textarea";
import { Fuel } from 'lucide-react';
import { useEstimateGas, useEstimateFeesPerGas, useAccount } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { useMemo, useEffect, useState } from "react";
import { setSignatureSigner, deriveMasterKeyFromAddress, toHex, randomBytes } from "@/lib/encrypt-decrypt.ts"
import Cards from "./cards";
import { createEncryptedCapsule } from "@/lib/createEncryptedCapsule.ts";
import { Button } from "./ui/button";
export default function Dashboard() {
  const ref = useRef(null);
  const inView = useInView(ref);
  const { openConnectModal} = useConnectModal();
  const { address,isConnected } = useAccount();
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [unlockDate, setUnlockDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [sessionKey, setSessionKey] = useState<CryptoKey | null>(null);
  const [dateResetKey, setDateResetKey] = useState(0);

  let session: { key: CryptoKey; nonce: string; issuedAt: number; expiresAt: number } | null = null;

  // ------------------ Helper Functions ------------------
  async function getSessionKey(signer: ethers.Signer) {
    const now = Math.floor(Date.now() / 1000);
    if (session && now < session.expiresAt) return session;

    const issuedAt = now;
    const expiresAt = issuedAt + 3600; // 1 hour session
    const nonce = toHex(randomBytes(16))
    const key = await deriveMasterKeyFromAddress(signer, nonce, issuedAt, expiresAt);

    session = { key, nonce, issuedAt, expiresAt };
    return session;
  }

  const handleCreateCapsule = async () => {
    if (!unlockDate) return alert("Select unlock date");
    if (!signer || !sessionKey) return alert("Wallet not connected");

    setLoading(true);
    try {
      const timestamp = Math.floor(unlockDate.getTime() / 1000);
      await createEncryptedCapsule({
        signer,
        sessionKey,
        plaintext: message,
        unlockDate: timestamp,
        title,
      });
      alert("Capsule created successfully ✅");
    } catch (err) {
      console.error("Failed to create capsule:", err);
      alert(`Failed to create capsule ${unlockDate}`);
    } finally {
      setLoading(false);
      setTitle("")
      setMessage("")
      setUnlockDate(undefined)
      setDateResetKey(k => k + 1);
    }
  };

  useEffect(() => {
    let canceled = false;

    const initWallet = async () => {
      try {
        if (!isConnected) {
          console.log("Wallet not connected, opening modal...");
          return;
        }

        // Wallet is connected, derive session key
        const walletSigner = await setSignatureSigner(); // from encrypt-decrypt.ts
        if (canceled) return;
        setSigner(walletSigner);

        const { key } = await getSessionKey(walletSigner);
        if (canceled) return;
        setSessionKey(key);
      } catch (err) {
        console.error("Wallet connection failed:", err);
        setSigner(null);
        setSessionKey(null);
      }
    };

    initWallet();
    return () => {
      canceled = true;
    };
  }, [isConnected]);

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd")
      .then(res => res.json())
      .then(data => setEthPrice(data.ethereum.usd));
  }, []);

  // ------------------ Transaction & Fees ------------------
  const tx = useMemo(() => {
    if (!openConnectModal || !address) return undefined;
    return {
      account: address as `0x${string}`,
      to: "0x330b880e6eAD0B2c7C837C3F2cb1B4c5D6D3e733" as `0x${string}`,
      value: parseEther("0.01"),
      chainId: 42161,
    };
  }, [openConnectModal, address]);

  const { data: gas } = useEstimateGas(tx);
  const { data: fees } = useEstimateFeesPerGas({ chainId: 42161 });

  const totalFee = useMemo(() => {
    if (!gas || !fees?.maxFeePerGas) return undefined;
    const buffer = parseEther("0.00005");
    return formatEther(gas * fees.maxFeePerGas + buffer);
  }, [gas, fees]);

  useEffect(() => {
    if (totalFee) console.log("Total Fee:", totalFee);
  }, [totalFee]);
    
    return <div>
      <Navbar />
      <div className="pt-30 text-center py-8 flex flex-col items-center gap-4 md:gap-6">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-2"><TextAnimate animation="slideDown" duration={0.75} by="word" className="inline-flex">Preserve your moments</TextAnimate> <br /><span className="text-transparent bg-clip-text bg-linear-to-r from-secondary to-primary">sealed in time.</span></h1>
        <p className="text-foreground text-base md:text-xl max-w-2xl tracking-tight px-2">A decentralized time capsule for your digital assets. Securely encrypt messages and media today, unlock them on a date you choose.</p>
        <div className="flex flex-col lg:flex-row gap-8 px-6 md:px-25 w-full mx-auto">
          <div className="w-full lg:w-7/12">
            <div className="bg-white/80 rounded-2xl p-5 md:p-8 relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2">New Capsule</h2>
                  <p className="text-xs md:text-sm">Seal a message on the blockchain.</p>
                </div>
                <Button onClick={handleCreateCapsule} disabled={loading} className="h-8 w-8 cursor-pointer rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors gap-2">
                  <Plus className="text-primary" />
                </Button>
              </div>
              <div className={`flex justify-around items-center w-full text-xs md:text-sm gap-1 ${openConnectModal ? "select-none pointer-events-none blur-[3px]" : ""}`}>
                <div className="bg-background/60 shadow-inner flex items-center h-8.5 mx-1/2 px-2.5  py-1.75 rounded-full">
                  <span className="relative flex items-center justify-center h-2.5 w-2.5 sm:h-3 sm:w-3 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                  </span>
                  Arbitrum Connected
                </div>
                <div className="h-8 w-full max-w-48 flex gap-2 items-center justify-center bg-gray-200/70 shadow-inner rounded-full">
                  <Fuel className="text-gray-500 h-5" /> <span>≈ {Number(totalFee).toFixed(6)} ETH <span className="m-0 text-xs text-gray-600">(${(Number(totalFee) * ethPrice).toFixed(2)})</span> </span>
                </div>
              </div>
              {openConnectModal && (
                <div className="absolute left-1/3 top-1/2">
                  <span className="text-lg font-bold">🔒Signin with wallet!</span>
                </div>)}
              <div className={`opacity-60 px-2 py-5 ${openConnectModal ? "mt-8 select-none pointer-events-none blur-[1.8px]" : ""}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 resize-none">
                  <div>
                    <Label className="text-xs md:text-sm mb-2 ml-2 uppercase">Title</Label>
                    <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 md:h-12 rounded-xl border border-gray-200 shadow-sm w-full" />
                  </div>
                  <div>
                    <Label className="text-xs md:text-sm mb-2 ml-2 uppercase">Unlock Date</Label>
                    {/* <Input type="date" className="h-10 md:h-12 rounded-xl border border-gray-200  shadow-sm w-full" /> */}
                    <DatePicker value={unlockDate} key={dateResetKey} onChange={(date) => setUnlockDate(date)} buttonClassName="hover:bg-transparent bg-transparent shadow-md rounded-xl h-10 md:h-12" />
                  </div>
                  <div className="col-span-0 sm:col-span-2">
                    <Label className="text-xs md:text-sm mb-2 ml-2 uppercase">Messages</Label>
                    <Textarea value={message} onChange={(e) => setMessage(e.target.value)} className="h-24 md:h-32 rounded-xl border border-gray-200 shadow-sm w-full px-4 py-3 overflow-auto resize-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-5/12 xl:w-4/12 flex flex-col gap-6 mt-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold">Your Archive <span className="font-normal text-xs text-gray-500 align-middle" ref={ref}>
                ({inView && (<CountUp key={inView ? "visible" : "hidden"} from={0} to={5} duration={0.5}>
                </CountUp>)})
              </span></h2>
            </div>
          
         
            <Cards title="Title" timeRemaining="01-10-2026" message="Yo was up!"></Cards>
          </div>
        </div>

        <footer className="mt-auto py-6 border-t border-gray-600/60">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <a href="https://github.com/coderlogy/Time-Capsule-Web3" className="hover:text-accent transition-colors ease-in-out duration-400"><p>© 2026 Time Capsule App Decentralized.</p></a>
            <div className="flex flex-wrap items-center justify-between gap-4 md:gap-6 md:justify-end text-xs">
              <a className="hover:text-accent transition-colors ease-in-out duration-400" href="#">Privacy</a>
              <a className="hover:text-accent transition-colors ease-in-out duration-400" href="#">Terms</a>
              <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                System Operational
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  }

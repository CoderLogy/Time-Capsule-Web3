import Navbar from "./Navbar";
import { Plus } from 'lucide-react';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import CountUp from "./CountUp";
import { useInView } from "motion/react";
import { useCallback, useRef } from "react";
import { TextAnimate } from "./ui/text-animate";
import { useConnectModal } from "@rainbow-me/rainbowkit"
import DatePicker from "@/components/ui/date-picker";
import { Textarea } from "./ui/textarea";
import { Fuel } from 'lucide-react';
import { useEstimateGas, useEstimateFeesPerGas, useAccount } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { memo,useMemo, useEffect, useState } from "react";
import Cards from "./Cards";
import { createEncryptedCapsule } from "@/lib/createEncryptedCapsule.ts";
import { Button } from "./ui/button";
import { getCapsules } from "@/lib/contract-api";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";


const HeroText = memo(function HeroText() {
  return (
    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-2">
      <TextAnimate animation="slideDown" duration={0.75} by="word" once={false} className="inline-flex" style={{fontFamily:"Raleway", fontSize:"1.15em", fontWeight: "600"}}>
        Preserve your moments
      </TextAnimate>
      <br />
      <span className="text-transparent bg-clip-text animate-gradient bg-linear-to-r from-primary via-accent to-primary bg-size-[200%_auto]" style={{fontFamily:"Cormorant Garamond", fontSize:"1.3em"}}>
        sealed in time.
      </span>
    </h1>
  )
})
  

export default function Dashboard() {
  const ref = useRef(null);
  const inView = useInView(ref);
  const { openConnectModal} = useConnectModal();
  const { address,isConnected } = useAccount();
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [unlockDate, setUnlockDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [dateResetKey, setDateResetKey] = useState(0);
  const [pendingTitles, setPendingTitles] = useState<string[]>([]); // ← optimistic pending cards
  const [search, setSearch] = useState("")
  const cardsContainerRef = useRef<HTMLDivElement>(null)
  

  const { data: capsules = [], refetch: refetchCapsules } = useQuery<Capsule[]>({
    queryKey: ['capsules', address],
    queryFn: () => getCapsules(address!),
    enabled: !!address && isConnected,
    refetchInterval: 30_000,
  });
  
  const handleCreateCapsule = async () => {
    if (!title) return toast.warning("Provide title to your capsule!");
    if (!unlockDate) return toast.warning("Select unlock date");
    if (!message) return toast.warning("Enter a new message!");
    if (!isConnected) return toast.error("Wallet not connected"), window.location.reload();

    const currentTitle = title;
    console.log(currentTitle)
    setLoading(true);
    setPendingTitles(prev => [...prev, currentTitle]); // show pending card immediately
    try {
      const timestamp = Math.floor(unlockDate.getTime() / 1000);
      //const signer = await setSignatureSigner();
      await createEncryptedCapsule({ address: address!, plaintext: message, unlockDate: timestamp, title });
      await refetchCapsules();
      toast.success("Capsule created successfully");
    } catch (err) {
      console.error("Failed to create capsule:", err);
      toast.error(`Failed to create capsule`);
    } finally {
      setLoading(false);
      setPendingTitles(prev => prev.filter(t => t !== currentTitle)); // remove pending card
      setTitle("");
      setMessage("");
      setUnlockDate(undefined);
      setDateResetKey(k => k + 1);
      setTimeout(() => {
        cardsContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 1000);
      const container = cardsContainerRef.current;
      // eslint-disable-next-line no-unsafe-finally
      if (!container) return;
      console.log("ref on create:", cardsContainerRef?.current)
      console.log("scrollHeight:", container.scrollHeight, "clientHeight:", container.clientHeight, "overflow:", getComputedStyle(container).overflowY);
    }
  };
  
  /*
  const handleTestCapsule = async () => {
  if (!signer || !sessionKey) return toast("Wallet not connected");

  const testTitle = `Test ${new Date().toLocaleTimeString()}`;
  const testMessage = "If you can read this, decryption works! 🎉";
  const oneMinuteFromNow = Math.floor(Date.now() / 1000) + 61; // 61s so contract accepts it

  const currentTitle = testTitle;
  setLoading(true);
  setPendingTitles(prev => [...prev, currentTitle]);
  try {
    await createEncryptedCapsule({
      signer,
      sessionKey,
      plaintext: testMessage,
      unlockDate: oneMinuteFromNow,
      title: testTitle,
    });
    await refetchCapsules();
  } catch (err) {
    console.error("Test capsule failed:", err);
    toast("Test failed — check console");
  } finally {
    setLoading(false);
    setPendingTitles(prev => prev.filter(t => t !== currentTitle));
  }
  };
  */
  
  /*
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
  // Remove these:
  const [sessionKey, setSessionKey] = useState<CryptoKey | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
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

  // Remove these imports:
  import { setSignatureSigner, deriveMasterKeyFromAddress, toHex, randomBytes } from "@/lib/encrypt-decrypt.ts"

  // Remove the entire initWallet useEffect
  */
  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd")
      .then(res => res.json())
      .then(data => setEthPrice(data.ethereum.usd));
  }, []);

  // ------------------ Transaction & Fees ------------------
  const tx = useCallback(() => {
    if (!isConnected || !address) return undefined;
    return {
      account: address as `0x${string}`,
      to: "0x19FF5dc69033523f1C5b1B5589f95D49b5EF7926" as `0x${string}`,
      value: parseEther("0.02"),
      chainId: 11155111,
    };
  }, [isConnected, address]);

  const { data: gas } = useEstimateGas(tx);
  const { data: fees } = useEstimateFeesPerGas({ chainId: 42161 });

  const totalFee = useMemo(() => {
    if (!gas || !fees?.maxFeePerGas) return undefined;
    const buffer = parseEther("0.00005");
    return formatEther(gas * fees.maxFeePerGas + buffer);
  }, [gas,fees]);

  useEffect(() => {
    if (totalFee) console.log("Total Fee:", totalFee);
  }, [totalFee]);

  const searchCapsule = useMemo(() => {
  const searchTerm = (search || '').toLowerCase();

  return capsules
    .filter(c => typeof c.title === 'string' && c.title.toLowerCase().includes(searchTerm))
    .sort((a, b) => {
      const titleA = (a.title || '').toLowerCase();
      const titleB = (b.title || '').toLowerCase();

      const score = (title: string) => {
        if (!title) return 0;                          // safeguard
        if (title === searchTerm) return 100;          // exact match
        if (title.startsWith(searchTerm)) return 50;   // starts with
        if (title.includes(searchTerm)) return 10;     // contains
        return 0;
      };

      const diff = score(titleB) - score(titleA);
      if (diff !== 0) return diff;

      return titleA.localeCompare(titleB);
    });
  }, [capsules, search]);
  
  return <div>
      <Navbar />
    <div className="pt-30 text-center py-8 flex flex-col items-center gap-4 md:gap-6">
      <HeroText />
        <p className="text-foreground text-base md:text-xl max-w-2xl tracking-tight px-2">A decentralized time capsule for your digital assets. Securely encrypt messages and media today, unlock them on a date you choose.</p>
        <div className="flex flex-col lg:flex-row gap-8 px-6 md:px-25 w-full mx-auto">
          <div className="w-full lg:w-7/12">
            <div className="bg-white/80 my-4 rounded-2xl p-5 md:p-8 relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2" style={{fontFamily:"Raleway", fontWeight:"600"}}>New Capsule</h2>
                  <p className="text-xs md:text-sm">Seal a message on the blockchain.</p>
                </div>
                <Button onClick={handleCreateCapsule} disabled={loading} className="h-8 w-auto cursor-pointer rounded-2xl bg-accent/30 flex items-center justify-center hover:bg-accent/50 transition-all gap-2 active:scale-90 ease-linear duration-200">
                  <span className="text-primary text-md">Create & Seal</span>
                </Button>
              </div>
              <div className={`flex justify-around items-center w-full text-xs md:text-sm gap-1 ${!isConnected ? "select-none pointer-events-none blur-[3px]" : ""}`}>
                <div className="bg-background/60 shadow-inner flex items-center h-8.5 mx-1/2 px-2.5  py-1.75 rounded-full">
                  <span className="relative flex items-center justify-center h-2.5 w-2.5 sm:h-3 sm:w-3 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                  </span>
                  Arbitrum Connected
                </div>
                <div className="h-8 w-full max-w-48 flex gap-2 items-center justify-center bg-gray-200/70 shadow-inner rounded-full">
                  <Fuel className="text-gray-500 h-5" /> <span>≈ {totalFee ? Number(totalFee).toFixed(6) : "..."} ETH <span className="m-0 text-xs text-gray-600">(${(Number(totalFee) * ethPrice).toFixed(2)})</span> </span>
                </div>
              </div>
              {!isConnected && (
                <div className="absolute left-1/3 top-1/2 sm:left-1/4 md:left-1/3 md:top-1/3">
                  <span className="text-lg font-bold">🔒Signin with wallet!</span>
                </div>)}
              <div className={`px-4 py-4 md:py-5 ${!isConnected ?  "mt-8 select-none pointer-events-none opacity-50  blur-[1.8px]" : ""}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 resize-none">
                  <div>
                    <Label htmlFor="CapsuleTitle" className="text-sm mb-2 ml-2 tracking-wider">Title</Label>
                    <Input id="CapsuleTitle" type="text" placeholder="Eleanor Rigby" value={title} onChange={(e) => setTitle(e.target.value)} className="text-sm h-10 md:h-12 rounded-xl border border-gray-300 shadow-sm w-full focus:scale-102" />
                  </div>
                  <div>
                    <Label htmlFor="CapsuleDatePicker" className="text-sm mb-2 ml-2 tracking-wide">Unlock Date</Label>
                    {/* <Input type="date" className="h-10 md:h-12 rounded-xl border border-gray-200  shadow-sm w-full" /> */}
                    <DatePicker value={unlockDate} key={dateResetKey} onChange={(date) => setUnlockDate(date)} buttonClassName="hover:bg-transparent bg-transparent border-gray-300! shadow-md rounded-xl h-10 md:h-12 focus:scale-102 active:scale-102"/>
                  </div>
                  <div className="col-span-0 sm:col-span-2">
                    <Label htmlFor="CapsuleMessage" className="text-sm mb-2 ml-2 tracking-wider">Messages</Label>
                    <Textarea id="CapsuleMessage" placeholder="Create a message for future self..." value={message} onChange={(e) => setMessage(e.target.value)} className="h-24 md:h-32 text-sm rounded-xl border border-gray-300 shadow-sm w-full px-4 py-3 overflow-auto resize-none focus:scale-102"/>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-5/12 xl:w-4/12 flex flex-col gap-6 mt-8 md:mt-11">
          <div className={`flex items-center ${capsules.length === 0 ? "justify-center" : "justify-between"} px-0 mx-0 md:px-2 md:mx-4`}>
            <Label htmlFor="SearchCapsules">
              <h2 className="text-xl font-bold pr-5" style={{fontFamily:"Raleway", fontWeight:"600"}}>Your Capsules <span className="font-normal text-xs text-gray-500 align-bottom" ref={ref}>
                ({inView && (<CountUp key={inView ? "visible" : "hidden"} from={0} to={searchCapsule.length} duration={0.3} onStart={() => {}} onEnd={() => {}}>
                </CountUp>)})
              </span></h2>
              </Label>
              {capsules.length >= 5 && (
                <input id="SearchCapsules" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="outline-0 resize-none h-8 w-1/2 rounded-xl bg-white/80 text-sm px-3 py-2 border border-gray-200 shadow-sm focus:scale-102"/>
              )}
            </div>
            <Cards capsules={searchCapsule} pendingTitles={pendingTitles} containerRef={cardsContainerRef}/>
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

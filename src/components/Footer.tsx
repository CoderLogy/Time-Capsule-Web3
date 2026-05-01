export default function Footer() {
    return (
        <footer className="mt-auto py-6 border-t border-gray-600/60">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                <a
                    href="https://github.com/coderlogy/Time-Capsule-Web3"
                    className="hover:text-accent transition-colors ease-in-out duration-200"
                >
                    <p>© 2026 Time Capsule App Decentralized</p>
                </a>
                <div className="flex flex-wrap items-center justify-between gap-4 md:gap-6 md:justify-end text-xs">
                    <a
                        className="hover:text-accent transition-colors ease-in-out duration-200"
                        href="https://github.com/CoderLogy/Time-Capsule-Web3/blob/main/PRIVACY.md"
                    >
                        Privacy
                    </a>
                    <a
                        className="hover:text-accent transition-colors ease-in-out duration-200"
                        href="https://github.com/CoderLogy/Time-Capsule-Web3/blob/main/TERMS.md"
                    >
                        Terms
                    </a>
                    <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                        <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                        System Operational
                    </div>
                </div>
            </div>
        </footer>
    );
}

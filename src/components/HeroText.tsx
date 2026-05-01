import { TextAnimate } from "./ui/text-animate";
import { memo } from "react";

const HeroText = () => {
    return (
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-2">
            <TextAnimate
                animation="slideDown"
                duration={0.75}
                by="word"
                once={false}
                className="inline-flex"
                style={{
                    fontFamily: "Raleway Variable",
                    fontSize: "1.15em",
                    fontWeight: "600"
                }}
            >
                Preserve your moments
            </TextAnimate>
            <br />
            <span
                className="text-transparent bg-clip-text animate-gradient bg-linear-to-r from-primary via-accent to-primary bg-size-[200%_auto]"
                style={{ fontFamily: "Cormorant Garamond", fontSize: "1.3em" }}
            >
                sealed in time.
            </span>
        </h1>
    );
};

export default memo(HeroText);

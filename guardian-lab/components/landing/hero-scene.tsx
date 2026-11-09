import Image from "next/image";
import guardian from "@/public/landing/guardian-hero-full-body.png";
import styles from "./hero.module.css";

const sizes = "(min-width: 1100px) 576px, (min-width: 768px) 362px, 264px";

export function HeroScene() {
  return (
    <>
      <div className={styles.visual}>
        <Image
          className={styles.fox}
          src={guardian}
          alt="Guardian, rubah investigator seluruh badan, memegang kaca pembesar dan bertumpu pada kolom tautan."
          fill
          loading="eager"
          fetchPriority="high"
          sizes={sizes}
          draggable={false}
        />
      </div>
      <div className={styles.hand} aria-hidden="true">
        <Image src={guardian} alt="" fill loading="eager" sizes={sizes} draggable={false} />
      </div>
    </>
  );
}

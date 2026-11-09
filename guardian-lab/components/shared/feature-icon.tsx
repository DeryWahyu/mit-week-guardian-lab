import {
  Award,
  BookOpen,
  BookOpenCheck,
  Box,
  Crown,
  FileCode2,
  FileSearch,
  Fingerprint,
  Flame,
  Globe,
  History,
  IdCard,
  ImageDown,
  Layers3,
  Link2,
  Medal,
  MessagesSquare,
  PanelsTopLeft,
  Phone,
  QrCode,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Timer,
  Trash2,
  TrendingUp,
  Trophy,
  UserRound,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./feature-icon.module.css";

const symbols = {
  rank: { Icon: Trophy, tone: "gold" },
  exp: { Icon: Zap, tone: "violet" },
  streak: { Icon: Flame, tone: "red" },
  quiz: { Icon: BookOpenCheck, tone: "blue" },
  case: { Icon: ShieldCheck, tone: "green" },
  progress: { Icon: TrendingUp, tone: "teal" },
  badge: { Icon: Award, tone: "gold" },
  history: { Icon: History, tone: "blue" },
  link: { Icon: Link2, tone: "teal" },
  messages: { Icon: MessagesSquare, tone: "violet" },
  permissions: { Icon: ShieldCheck, tone: "blue" },
  casebook: { Icon: BookOpen, tone: "blue" },
  browser: { Icon: PanelsTopLeft, tone: "blue" },
  timer: { Icon: Timer, tone: "violet" },
  cleanup: { Icon: Trash2, tone: "teal" },
  identity: { Icon: IdCard, tone: "blue" },
  code: { Icon: Fingerprint, tone: "violet" },
  layers: { Icon: Layers3, tone: "blue" },
  record: { Icon: FileSearch, tone: "blue" },
  url: { Icon: Globe, tone: "blue" },
  qr: { Icon: QrCode, tone: "violet" },
  apk: { Icon: FileCode2, tone: "teal" },
  image: { Icon: ImageDown, tone: "violet" },
  people: { Icon: Users, tone: "teal" },
  share: { Icon: Share2, tone: "teal" },
  user: { Icon: UserRound, tone: "blue" },
  phone: { Icon: Phone, tone: "green" },
  security: { Icon: ShieldCheck, tone: "teal" },
  risk: { Icon: ShieldAlert, tone: "red" },
  model: { Icon: Box, tone: "slate" },
  crown: { Icon: Crown, tone: "gold" },
  silverMedal: { Icon: Medal, tone: "silver" },
  bronzeMedal: { Icon: Medal, tone: "bronze" },
} as const;

export type FeatureIconName = keyof typeof symbols;

export function FeatureIcon({
  name,
  size = "panel",
  muted = false,
  className,
}: {
  name: FeatureIconName;
  size?: "panel" | "small" | "large" | "inline";
  muted?: boolean;
  className?: string;
}) {
  const { Icon, tone } = symbols[name];
  return (
    <span
      className={cn(styles.icon, className)}
      data-icon={name}
      data-tone={tone}
      data-size={size}
      data-muted={muted || undefined}
      aria-hidden="true"
    >
      <Icon strokeWidth={1.85} />
    </span>
  );
}

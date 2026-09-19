import { SiGoogle, SiZomato, SiYelp, SiInstagram } from "react-icons/si";
import { FaAmazon } from "react-icons/fa";

export const PLATFORMS = {
  google: {
    key: "google",
    name: "Google",
    Icon: SiGoogle,
    color: "#4285F4",
    soft: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
    ring: "ring-blue-200",
    desc: "Google Business reviews",
  },
  zomato: {
    key: "zomato",
    name: "Zomato",
    Icon: SiZomato,
    color: "#CB202D",
    soft: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    ring: "ring-red-200",
    desc: "Restaurant & delivery",
  },
  amazon: {
    key: "amazon",
    name: "Amazon",
    Icon: FaAmazon,
    color: "#FF9900",
    soft: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    ring: "ring-amber-200",
    desc: "Product reviews",
  },
  yelp: {
    key: "yelp",
    name: "Yelp",
    Icon: SiYelp,
    color: "#D32323",
    soft: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-200",
    ring: "ring-rose-200",
    desc: "Local business reviews",
  },
  instagram: {
    key: "instagram",
    name: "Instagram",
    Icon: SiInstagram,
    color: "#E4405F",
    soft: "bg-pink-50",
    text: "text-pink-600",
    border: "border-pink-200",
    ring: "ring-pink-200",
    desc: "Comments & DMs",
  },
};

export const PLATFORM_LIST = Object.values(PLATFORMS);

export const URGENCY = {
  red: {
    key: "red",
    label: "High",
    long: "Needs action",
    dot: "bg-red-500",
    soft: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    solid: "bg-red-500",
    hex: "#EF4444",
  },
  yellow: {
    key: "yellow",
    label: "Medium",
    long: "Moderate",
    dot: "bg-amber-500",
    soft: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    solid: "bg-amber-500",
    hex: "#F59E0B",
  },
  green: {
    key: "green",
    label: "Low",
    long: "Positive",
    dot: "bg-emerald-500",
    soft: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    solid: "bg-emerald-500",
    hex: "#10B981",
  },
};

export const BUSINESS_TYPES = [
  "Restaurant",
  "Retail Store",
  "Salon",
  "Service Business",
  "Other",
];

export const TONES = [
  { key: "Friendly", label: "Friendly" },
  { key: "Formal", label: "Formal" },
  { key: "Apologetic-and-solution-focused", label: "Apologetic & Solution" },
];

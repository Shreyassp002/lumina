"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Register once; safe to call multiple times
if (typeof window !== "undefined") {
    try {
        gsap.registerPlugin(ScrollTrigger, useGSAP);
    } catch (e) { }
}

export { gsap, ScrollTrigger, useGSAP };



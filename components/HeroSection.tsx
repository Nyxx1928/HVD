'use client';

import { motion } from 'framer-motion';
import Ballpit from '@/components/Ballpit';

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6 py-24">
      <div className="absolute inset-0">
        <Ballpit
          count={100}
          gravity={0.01}
          friction={0.9975}
          wallBounce={0.95}
          followCursor={false}
          colors={[0xff1e56, 0xff5d8f, 0xff8fab, 0xffc2d6, 0xffe0ec]}
        />
      </div>
      <motion.div
        className="relative z-10 flex max-w-2xl flex-col items-center gap-6 text-center"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.14 } }
        }}
      >
        <motion.p
          className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400"
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.85, ease: 'easeOut' }}
        >
          Valentine&apos;s Day 2026
        </motion.p>
        <motion.h1
          className="text-balance text-4xl font-semibold leading-tight sm:text-5xl"
          variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.95, ease: 'easeOut' }}
        >
          Send a little love into the air.
        </motion.h1>
        <motion.p
          className="text-pretty text-lg text-zinc-600 dark:text-zinc-300"
          variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.95, ease: 'easeOut' }}
        >
          Drop a note for someone special, then watch the wall bloom with sweet words from the
          whole room.
        </motion.p>
        <motion.div
          className="flex flex-col gap-3 sm:flex-row"
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.85, ease: 'easeOut' }}
        >
          <a
            href="#love-note-form"
            className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Leave a love note
          </a>
          <a
            href="#love-wall"
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 dark:border-white/30 dark:text-zinc-100 dark:hover:border-white/60"
          >
            Read the love wall
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}

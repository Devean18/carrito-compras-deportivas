import { onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const DELAY = { d1: 0.08, d2: 0.16, d3: 0.24, d4: 0.32, d5: 0.40, d6: 0.48 }

/**
 * Anima elementos .reveal y .reveal-scale con GSAP ScrollTrigger.
 * Usa MutationObserver para detectar elementos añadidos de forma asíncrona.
 */
export function useReveal(selector = '.reveal, .reveal-scale') {
  let mo

  const animateEl = (el) => {
    if (el._gsapReveal) return
    el._gsapReveal = true

    const dc      = [...el.classList].find(c => /^reveal-d\d+$/.test(c))
    const delay   = dc ? (DELAY[dc.replace('reveal-', '')] ?? 0) : 0
    const isScale = el.classList.contains('reveal-scale')

    gsap.fromTo(
      el,
      isScale ? { opacity: 0, scale: 0.93 } : { opacity: 0, y: 28 },
      {
        opacity: 1,
        ...(isScale ? { scale: 1 } : { y: 0 }),
        duration: 0.7,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
      }
    )
  }

  onMounted(() => {
    document.querySelectorAll(selector).forEach(animateEl)

    mo = new MutationObserver((muts) => {
      muts.forEach((mut) => {
        mut.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return
          if (node.matches?.(selector)) animateEl(node)
          node.querySelectorAll?.(selector).forEach(animateEl)
        })
      })
    })
    mo.observe(document.body, { childList: true, subtree: true })
  })

  onUnmounted(() => {
    ScrollTrigger.getAll().forEach(t => t.kill())
    mo?.disconnect()
  })
}

<template>
  <div class="pomodoro-circle-container">
    <svg ref="svgRef" :width="computedSize" :height="computedSize" class="pomodoro-circle"></svg>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import * as d3 from 'd3'
import type { Phase } from '@/composables/usePomodoro'

interface Props {
  progress: number
  phase: Phase
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 400
})

const svgRef = ref<SVGSVGElement | null>(null)

// Responsive size computation
const computedSize = computed(() => {
  if (typeof window === 'undefined') return props.size

  const width = window.innerWidth

  // Extra small phones (< 375px)
  if (width < 375) return 250
  // Small phones (375px - 480px)
  if (width < 480) return 280
  // Regular phones (480px - 640px)
  if (width < 640) return 320
  // Large phones/small tablets (640px - 768px)
  if (width < 768) return 360
  // Tablets (768px - 1024px)
  if (width < 1024) return 380
  // Desktop and above
  return props.size
})

const phaseColors = {
  work: {
    primary: '#ef4444',
    secondary: '#fca5a5',
    gradient: ['#ef4444', '#dc2626']
  },
  'short-break': {
    primary: '#3b82f6',
    secondary: '#93c5fd',
    gradient: ['#3b82f6', '#2563eb']
  },
  'long-break': {
    primary: '#8b5cf6',
    secondary: '#c4b5fd',
    gradient: ['#8b5cf6', '#7c3aed']
  }
}

const setupVisualization = () => {
  if (!svgRef.value) return

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const width = computedSize.value
  const height = computedSize.value
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 2 - 20

  // Create gradient definitions
  const defs = svg.append('defs')

  const gradient = defs
    .append('linearGradient')
    .attr('id', 'progressGradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '100%')
    .attr('y2', '100%')

  const currentColors = phaseColors[props.phase]

  gradient
    .append('stop')
    .attr('offset', '0%')
    .attr('stop-color', currentColors.gradient[0] as string)

  gradient
    .append('stop')
    .attr('offset', '100%')
    .attr('stop-color', currentColors.gradient[1] as string)

  // Glow filter
  const filter = defs
    .append('filter')
    .attr('id', 'glow')
    .attr('x', '-50%')
    .attr('y', '-50%')
    .attr('width', '200%')
    .attr('height', '200%')

  filter
    .append('feGaussianBlur')
    .attr('stdDeviation', '4')
    .attr('result', 'coloredBlur')

  const feMerge = filter.append('feMerge')
  feMerge.append('feMergeNode').attr('in', 'coloredBlur')
  feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

  const g = svg.append('g').attr('transform', `translate(${centerX},${centerY})`)

  // Background circle
  g.append('circle')
    .attr('r', radius)
    .attr('fill', 'none')
    .attr('stroke', '#e5e7eb')
    .attr('stroke-width', 20)
    .attr('opacity', 0.3)

  // Progress arc
  const arc = d3
    .arc()
    .innerRadius(radius - 10)
    .outerRadius(radius + 10)
    .startAngle(-Math.PI / 2)
    .cornerRadius(10)

  const progressArc = g
    .append('path')
    .attr('class', 'progress-arc')
    .attr('fill', 'url(#progressGradient)')
    .attr('filter', 'url(#glow)')

  // Pulse circle for visual interest
  const pulseCircle = g
    .append('circle')
    .attr('r', radius - 30)
    .attr('fill', 'none')
    .attr('stroke', currentColors.secondary as string)
    .attr('stroke-width', 2)
    .attr('opacity', 0.5)

  // Animate pulse
  const pulse = () => {
    pulseCircle
      .transition()
      .duration(2000)
      .ease(d3.easeSinInOut)
      .attr('r', radius - 25)
      .attr('opacity', 0.8)
      .transition()
      .duration(2000)
      .ease(d3.easeSinInOut)
      .attr('r', radius - 30)
      .attr('opacity', 0.5)
      .on('end', pulse)
  }
  pulse()

  // Update progress function
  const updateProgress = (progress: number) => {
    const endAngle = -Math.PI / 2 + (progress / 100) * 2 * Math.PI
    const arcGenerator = arc.endAngle(endAngle) as any

    progressArc
      .transition()
      .duration(300)
      .ease(d3.easeLinear)
      .attr('d', arcGenerator)
  }

  updateProgress(props.progress)

  // Store update function for later use
  ;(svgRef.value as any).__updateProgress = updateProgress
  ;(svgRef.value as any).__updateColors = () => {
    const colors = phaseColors[props.phase]
    gradient.select('stop:nth-child(1)').attr('stop-color', colors.gradient[0] as string)
    gradient.select('stop:nth-child(2)').attr('stop-color', colors.gradient[1] as string)
    pulseCircle.attr('stroke', colors.secondary as string)
  }
}

onMounted(() => {
  setupVisualization()

  // Re-render on window resize
  window.addEventListener('resize', handleResize)
})

let resizeTimeout: number
const handleResize = () => {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    setupVisualization()
  }, 200)
}

watch([() => props.progress, () => props.phase], () => {
  if (svgRef.value) {
    const updateProgress = (svgRef.value as any).__updateProgress
    const updateColors = (svgRef.value as any).__updateColors

    if (updateColors) {
      updateColors()
    }

    if (updateProgress) {
      updateProgress(props.progress)
    }
  }
})

watch(() => props.phase, () => {
  setupVisualization()
})

onUnmounted(() => {
  if (svgRef.value) {
    d3.select(svgRef.value).selectAll('*').interrupt()
  }
  window.removeEventListener('resize', handleResize)
  clearTimeout(resizeTimeout)
})
</script>

<style scoped>
.pomodoro-circle-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.pomodoro-circle {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  height: auto;
}
</style>

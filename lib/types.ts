// OsteoTab CRM - TypeScript Types

export interface Photo {
  id: string
  url: string
  date: string
  description?: string
  projection?: 'front' | 'back' | 'left' | 'right' | 'other'
}

export interface ClientFile {
  id: string
  name: string
  url: string
  type: string
  date: string
}

export interface Anamnesis {
  symptoms: string
  firstSymptoms: string
  complaints: string
  injuries: string
  scars: string
  medications: string
  birthTraumas: string
  sleepPositions: string
  specialists: string
  treatment: string
  treatmentResult: string
  diagnosis: string
  additionalInfo: string
  desiredResult: string
  bodyReadiness: number // 1-10
  mindReadiness: number // 1-10
  consciousnessReadiness: number // 1-10
}

export interface SpineSegment {
  id: string
  name: string
  status: 'normal' | 'restricted' | 'hypermobile' | 'blocked'
  direction?: 'left' | 'right' | 'both'
  notes?: string
}

export interface SpineData {
  segments: SpineSegment[]
  annotations: SpineAnnotation[]
}

export interface SpineAnnotation {
  id: string
  x: number
  y: number
  width: number
  height: number
  color: string
  type: 'circle' | 'line' | 'freehand'
  points?: { x: number; y: number }[]
}

export interface NeuroTest {
  id: string
  name: string
  status?: 'normal' | 'deviation'
  postStatus?: 'normal' | 'deviation'
  results: {
    date?: string
    current: string
    previous?: string
    initial?: string
    postSession?: string
  }
}

export interface GravityData {
  patterns?: {
    breathing: '+' | '-' | 'neutral'
    rightStep: '+' | '-' | 'neutral'
    leftStep: '+' | '-' | 'neutral'
    vertical: '+' | '-' | 'neutral'
  }
  littleToeMarker?: {
    foot: 'left' | 'right'
    toe: 1 | 2 | 3 | 4 | 5
  }
  totalWeight?: number
  leftCost?: number
  rightCost?: number
  anteriorPosterior: {
    upper: '+' | '-' | 'neutral'
    lower: '+' | '-' | 'neutral'
  }
  leftRight: {
    upper: '+' | '-' | 'neutral'
    lower: '+' | '-' | 'neutral'
  }
  footLeft: {
    front: number // percentage 0-100
    back: number
    inner: number
    outer: number
  }
  footRight: {
    front: number
    back: number
    inner: number
    outer: number
  }
  weightLeft: number // kg
  weightRight: number // kg
}

export interface BodyRegion {
  id: string
  name: string
  status: '+' | '-' | 'neutral'
  side: 'front' | 'back'
  pairKey?: string
  bodySide?: 'left' | 'right' | 'center'
}

export interface BodyRegionData {
  regions: BodyRegion[]
}

export interface MuscleChain {
  id: string
  name: string
  status: 'norm' | 'break'
  leftStatus?: 'norm' | 'break'
  rightStatus?: 'norm' | 'break'
  group?: 'superficial' | 'deep' | 'lateral' | 'spiral'
  breakPoints?: string[]
}

export interface MuscleChainData {
  chains: MuscleChain[]
}

export interface Visit {
  id: string
  date: string
  spineData: SpineData
  neuroTests: NeuroTest[]
  gravityData: GravityData
  bodyRegions: BodyRegionData
  muscleChains: MuscleChainData
  notes: string
  nextPlan: string
  aiSummary?: string
}

export interface Payment {
  id: string
  date: string
  visitId?: string
  clientId: string
  amount: number
  duration?: number
  cost?: number
  paid?: number
  debt?: number
  method: 'cash' | 'card' | 'transfer'
  status: 'paid' | 'pending' | 'cancelled'
  notes?: string
  description?: string
  createdAt?: string
}

export interface Client {
  id: string
  name: string
  firstName?: string
  lastName?: string
  birthDate?: string
  phone?: string
  email?: string
  gender?: 'male' | 'female'
  status?: 'active' | 'inactive'
  createdAt: string
  firstVisit: string
  lastVisit: string
  photos: Photo[]
  files: ClientFile[]
  anamnesis: Anamnesis
  visits: Visit[]
  payments: Payment[]
  // Legacy body regions data for analytics
  bodyRegions?: Record<string, { painLevel: number }>
}

export interface Appointment {
  id: string
  clientId?: string
  clientName: string
  date: string
  time: string
  duration: number
  visitId?: string
  paymentId?: string
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled'
}

export interface Settings {
  claudeApiKey?: string
  defaultSessionDuration: number
  defaultSessionCost: number
}

// Default empty objects for initialization
export const emptyAnamnesis: Anamnesis = {
  symptoms: '',
  firstSymptoms: '',
  complaints: '',
  injuries: '',
  scars: '',
  medications: '',
  birthTraumas: '',
  sleepPositions: '',
  specialists: '',
  treatment: '',
  treatmentResult: '',
  diagnosis: '',
  additionalInfo: '',
  desiredResult: '',
  bodyReadiness: 5,
  mindReadiness: 5,
  consciousnessReadiness: 5,
}

export const emptySpineData: SpineData = {
  segments: [],
  annotations: [],
}

export const emptyGravityData: GravityData = {
  patterns: {
    breathing: 'neutral',
    rightStep: 'neutral',
    leftStep: 'neutral',
    vertical: 'neutral',
  },
  anteriorPosterior: { upper: 'neutral', lower: 'neutral' },
  leftRight: { upper: 'neutral', lower: 'neutral' },
  footLeft: { front: 25, back: 25, inner: 25, outer: 25 },
  footRight: { front: 25, back: 25, inner: 25, outer: 25 },
  weightLeft: 0,
  weightRight: 0,
  totalWeight: 0,
  leftCost: 0,
  rightCost: 0,
}

export const emptyBodyRegionData: BodyRegionData = {
  regions: [],
}

export const emptyMuscleChainData: MuscleChainData = {
  chains: [],
}

export function createEmptyVisit(): Visit {
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    spineData: emptySpineData,
    neuroTests: [],
    gravityData: emptyGravityData,
    bodyRegions: emptyBodyRegionData,
    muscleChains: emptyMuscleChainData,
    notes: '',
    nextPlan: '',
  }
}

export function createEmptyClient(name: string): Client {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    firstVisit: now,
    lastVisit: now,
    createdAt: now,
    status: 'active',
    photos: [],
    files: [],
    anamnesis: emptyAnamnesis,
    visits: [],
    payments: [],
  }
}

export function normalizeVisit(visit: Visit): Visit {
  return {
    ...visit,
    spineData: {
      ...emptySpineData,
      ...visit.spineData,
      segments: visit.spineData?.segments || [],
      annotations: visit.spineData?.annotations || [],
    },
    neuroTests: visit.neuroTests || [],
    gravityData: {
      ...emptyGravityData,
      ...visit.gravityData,
      patterns: {
        breathing: visit.gravityData?.patterns?.breathing || 'neutral',
        rightStep: visit.gravityData?.patterns?.rightStep || 'neutral',
        leftStep: visit.gravityData?.patterns?.leftStep || 'neutral',
        vertical: visit.gravityData?.patterns?.vertical || 'neutral',
      },
      footLeft: {
        ...emptyGravityData.footLeft,
        ...visit.gravityData?.footLeft,
      },
      footRight: {
        ...emptyGravityData.footRight,
        ...visit.gravityData?.footRight,
      },
    },
    bodyRegions: {
      ...emptyBodyRegionData,
      ...visit.bodyRegions,
      regions: visit.bodyRegions?.regions || [],
    },
    muscleChains: {
      ...emptyMuscleChainData,
      ...visit.muscleChains,
      chains: visit.muscleChains?.chains || [],
    },
    notes: visit.notes || '',
    nextPlan: visit.nextPlan || '',
  }
}

export function normalizeClient(client: Client): Client {
  const fallbackDate = client.createdAt || client.firstVisit || new Date().toISOString()
  return {
    ...client,
    photos: client.photos || [],
    files: client.files || [],
    anamnesis: {
      ...emptyAnamnesis,
      ...client.anamnesis,
    },
    visits: (client.visits || []).map(normalizeVisit),
    payments: client.payments || [],
    createdAt: client.createdAt || fallbackDate,
    firstVisit: client.firstVisit || fallbackDate,
    lastVisit: client.lastVisit || client.firstVisit || fallbackDate,
  }
}

export function normalizePayment(payment: Payment): Payment {
  const cost = payment.cost ?? payment.amount ?? 0
  const paid = payment.paid ?? (payment.status === 'paid' ? payment.amount : 0)
  return {
    ...payment,
    amount: cost,
    cost,
    paid,
    debt: Math.max(cost - paid, 0),
  }
}

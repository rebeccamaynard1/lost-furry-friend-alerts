/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as lostPetAlert } from './lost-pet-alert.tsx'
import { template as boostExpiry } from './boost-expiry.tsx'
import { template as listInclusionNotice } from './list-inclusion-notice.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'lost-pet-alert': lostPetAlert,
  'boost-expiry': boostExpiry,
  'list-inclusion-notice': listInclusionNotice,
}

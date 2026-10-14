import type { WorkingHours } from './slots'

export type SiteSettings = {
  phone: string
  address: string
  socials: Record<string, string>
  working_hours: WorkingHours
}
export type SiteService = {
  id: string
  title: string
  description: string
  price_from: number
  duration_min: number
  icon: string
}
export type SiteReview = { id: string; author: string; body: string; rating: number }
export type SiteContent = { settings: SiteSettings; services: SiteService[]; reviews: SiteReview[] }

const day = { open: '09:00', close: '18:00' }

/** Placeholder content used until Supabase credentials are configured. */
export const FALLBACK_CONTENT: SiteContent = {
  settings: {
    phone: '+380 XX XXX XX XX',
    address: 'м. Стрий, вул. … ',
    socials: {},
    working_hours: {
      '0': null,
      '1': day,
      '2': day,
      '3': day,
      '4': day,
      '5': day,
      '6': { open: '10:00', close: '15:00' },
    },
  },
  services: [
    { id: 'diagnostics', title: 'Діагностика', description: 'Комп’ютерна й ручна діагностика всіх систем авто.', price_from: 500, duration_min: 60, icon: 'scan' },
    { id: 'suspension', title: 'Ходова частина', description: 'Ремонт і заміна елементів підвіски та рульового керування.', price_from: 800, duration_min: 120, icon: 'suspension' },
    { id: 'maintenance', title: 'Технічне обслуговування', description: 'Заміна масла, фільтрів і рідин за регламентом виробника.', price_from: 1200, duration_min: 90, icon: 'oil' },
    { id: 'engine', title: 'Ремонт двигуна', description: 'Від ремонту ГРМ до капітального ремонту мотора.', price_from: 2500, duration_min: 240, icon: 'engine' },
    { id: 'electrics', title: 'Автоелектрика', description: 'Пошук і усунення несправностей електрообладнання.', price_from: 600, duration_min: 90, icon: 'bolt' },
    { id: 'brakes', title: 'Гальмівна система', description: 'Колодки, диски, супорти, прокачка гальм.', price_from: 700, duration_min: 90, icon: 'brake' },
    { id: 'body', title: 'Кузовний ремонт', description: 'Рихтування, зварювання, фарбування та полірування.', price_from: 1500, duration_min: 480, icon: 'body' },
    { id: 'tires', title: 'Шиномонтаж', description: 'Сезонна заміна, балансування, ремонт проколів.', price_from: 400, duration_min: 45, icon: 'tire' },
  ],
  reviews: [
    { id: 'r1', author: 'Андрій К.', body: 'Знайшли причину стуку в підвісці, яку не могли знайти в двох інших сервісах. Рекомендую.', rating: 5 },
    { id: 'r2', author: 'Олег М.', body: 'Записався онлайн на ТО, приїхав у точний час, забрав авто того ж дня. Зручно й без черг.', rating: 5 },
    { id: 'r3', author: 'Ірина Л.', body: 'Робили гальма та діагностику. Показали старі деталі, дали гарантію. Рекомендую.', rating: 5 },
  ],
}

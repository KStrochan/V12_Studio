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
  duration_min: number
  icon: string
}
export type SiteReview = { id: string; author: string; body: string; rating: number }
export type SiteContent = { settings: SiteSettings; services: SiteService[]; reviews: SiteReview[] }

const day = { open: '09:00', close: '18:00' }

/** Real business contacts with sample services/reviews, used until Supabase credentials are configured. */
export const FALLBACK_CONTENT: SiteContent = {
  settings: {
    phone: '+380 50 828 08 59',
    address: 'вулиця Клима Савури, 2б, Стрий, Львівська область, 82404',
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
    { id: 'diagnostics', title: 'Діагностика', description: 'Комп’ютерна й ручна діагностика всіх систем авто.', duration_min: 60, icon: 'scan' },
    { id: 'suspension', title: 'Ходова частина', description: 'Ремонт і заміна елементів підвіски та рульового керування.', duration_min: 120, icon: 'suspension' },
    { id: 'maintenance', title: 'Технічне обслуговування', description: 'Заміна масла, фільтрів і рідин за регламентом виробника.', duration_min: 90, icon: 'oil' },
    { id: 'engine', title: 'Ремонт двигуна', description: 'Від ремонту ГРМ до капітального ремонту мотора.', duration_min: 240, icon: 'engine' },
    { id: 'electrics', title: 'Автоелектрика', description: 'Пошук і усунення несправностей електрообладнання.', duration_min: 90, icon: 'bolt' },
    { id: 'brakes', title: 'Гальмівна система', description: 'Колодки, диски, супорти, прокачка гальм.', duration_min: 90, icon: 'brake' },
    { id: 'body', title: 'Кузовний ремонт', description: 'Рихтування, зварювання, фарбування та полірування.', duration_min: 480, icon: 'body' },
    { id: 'tires', title: 'Шиномонтаж', description: 'Сезонна заміна, балансування, ремонт проколів.', duration_min: 45, icon: 'tire' },
  ],
  reviews: [
    { id: 'r1', author: 'Андрій К.', body: 'Знайшли причину стуку в підвісці, яку не могли знайти в двох інших сервісах. Рекомендую.', rating: 5 },
    { id: 'r2', author: 'Олег М.', body: 'Записався онлайн на ТО, приїхав у точний час, забрав авто того ж дня. Зручно й без черг.', rating: 5 },
    { id: 'r3', author: 'Ірина Л.', body: 'Робили гальма та діагностику. Показали старі деталі, дали гарантію. Рекомендую.', rating: 5 },
  ],
}

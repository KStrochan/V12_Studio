export type PhotoRole = 'hero' | 'banner' | 'gallery'

export type Photo = {
  /** Public path (file lives in /public/photos). */
  src: string
  /** Honest Ukrainian description of what the picture shows. Also used as lightbox caption. */
  alt: string
  /** Real pixel size of the file on disk (checked by tests). */
  width: number
  height: number
  /** Tiny base64 JPEG for next/image placeholder="blur". */
  blur?: string
  /** Attribution line (optional; the license does not require it). */
  credit?: string
  role: PhotoRole
}

/**
 * TEMPORARY free stock photos (Unsplash License), NOT pictures of the real service.
 * To use real photos: replace the files in public/photos or edit this list. See docs/PHOTOS.md.
 */
export const PHOTOS: Photo[] = [
  {
    src: '/photos/garage-interior.jpg',
    alt: 'Просторий напівтемний гараж з верстаками, інструментом і лампами денного світла (ілюстративне стокове фото)',
    width: 1600,
    height: 1067,
    blur: 'data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAHAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAMF/8QAHRAAAQQCAwAAAAAAAAAAAAAAAQACAxEEEhQhYf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAVEQEBAAAAAAAAAAAAAAAAAAAAEf/aAAwDAQACEQMRAD8AyoXWw6Rg0LKrz4x0cZtj1ESD/9k=',
    credit: 'Фото: Quilia / Unsplash',
    role: 'hero',
  },
  {
    src: '/photos/wrenches.jpg',
    alt: 'Гайкові ключі та торцеві головки в ящику для інструментів (ілюстративне стокове фото)',
    width: 1600,
    height: 1067,
    blur: 'data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAHAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAIE/8QAHxAAAQQCAgMAAAAAAAAAAAAAAQACAxEEBRITISJR/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAH/xAAVEQEBAAAAAAAAAAAAAAAAAAABAP/aAAwDAQACEQMRAD8Ay48XSZcSMF4LbDSa9qolS3Z7CJojbKQGjiPPxEUGJf/Z',
    credit: 'Фото: Isabela Kronemberger / Unsplash',
    role: 'gallery',
  },
  {
    src: '/photos/engine-carburetor.jpg',
    alt: 'Двигун з оранжево-червоною кришкою клапанів, карбюратором і джгутами проводів під капотом (ілюстративне стокове фото)',
    width: 1600,
    height: 1068,
    blur: 'data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAHAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAQF/8QAHRAAAgICAwEAAAAAAAAAAAAAAQIAAxFBBCEiMv/EABUBAQEAAAAAAAAAAAAAAAAAAAAC/8QAFREBAQAAAAAAAAAAAAAAAAAAAEH/2gAMAwEAAhEDEQA/AMTjCt6wgtZc+t9EDWJEXOftoiWR/9k=',
    credit: 'Фото: Alex Marc Wagner / Unsplash',
    role: 'gallery',
  },
  {
    src: '/photos/brake-disc-drilled.jpg',
    alt: 'Перфорований гальмівний диск і супорт на авто під час ремонту ходової (ілюстративне стокове фото)',
    width: 1600,
    height: 1069,
    blur: 'data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAHAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAMF/8QAHxAAAQMDBQAAAAAAAAAAAAAAAQACEQMEEwUSITFB/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAH/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDDr3eW0aRSYTxkf0S6ZV265U2iSQY8lERH/9k=',
    credit: 'Фото: Erik Mclean / Unsplash',
    role: 'gallery',
  },
  {
    src: '/photos/wheel-brake.jpg',
    alt: 'Гальмівний диск і супорт на знятому колесі в темному боксі (ілюстративне стокове фото)',
    width: 1600,
    height: 1067,
    blur: 'data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAHAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAdEAACAgIDAQAAAAAAAAAAAAABAgARAxIEEyEx/8QAFQEBAQAAAAAAAAAAAAAAAAAAAQP/xAAWEQEBAQAAAAAAAAAAAAAAAAABAAL/2gAMAwEAAhEDEQA/AIuLgcKlByuwdLLaUVI+17Jb9IdtQ+t+WRESmgIL/9k=',
    credit: 'Фото: ün LIU / Unsplash',
    role: 'gallery',
  },
  {
    src: '/photos/brake-disc-mono.jpg',
    alt: 'Гальмівний диск зблизька в монохромних тонах (ілюстративне стокове фото)',
    width: 1600,
    height: 1067,
    blur: 'data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAHAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAQF/8QAHRAAAgICAwEAAAAAAAAAAAAAAQIAAyFBBBMxcf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCHhl2pp6iBSqk2q2xv7iYNrBrXK2gKWJAz5EQP/9k=',
    credit: 'Фото: Karan Suthar / Unsplash',
    role: 'banner',
  },
  {
    src: '/photos/hands-wrench-engine.jpg',
    alt: 'Руки майстра з гайковим ключем біля двигуна (ілюстративне стокове фото)',
    width: 1600,
    height: 1200,
    blur: 'data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAIG/8QAHBABAAIDAAMAAAAAAAAAAAAAAQIDABEhMUFh/8QAFAEBAAAAAAAAAAAAAAAAAAAAAv/EABURAQEAAAAAAAAAAAAAAAAAAAAR/9oADAMBAAIRAxEAPwDM0WVTdXix1yMeGzxv5ltwql7EfRDhjGGHX//Z',
    credit: 'Фото: Christian Buehner / Unsplash',
    role: 'gallery',
  },
  {
    src: '/photos/fuse-box-hands.jpg',
    alt: 'Рука біля блока запобіжників і реле під капотом: електрика авто (ілюстративне стокове фото)',
    width: 1600,
    height: 1067,
    blur: 'data:image/jpeg;base64,/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAHAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAQF/8QAHBAAAgIDAQEAAAAAAAAAAAAAAQMAAgQREjFB/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAL/xAAWEQEBAQAAAAAAAAAAAAAAAAAAAQL/2gAMAwEAAhEDEQA/AMFDmIaHA2Zxbkgn2XVrgMqGWxQDYbI2fsRFVl//2Q==',
    credit: 'Фото: Sincerely Media / Unsplash',
    role: 'gallery',
  },
]

export function getHeroPhoto(): Photo {
  return PHOTOS.find((p) => p.role === 'hero') ?? PHOTOS[0]
}

export function getBannerPhoto(): Photo {
  return PHOTOS.find((p) => p.role === 'banner') ?? PHOTOS[PHOTOS.length - 1]
}

export function getGalleryPhotos(): Photo[] {
  return PHOTOS.filter((p) => p.role === 'gallery')
}

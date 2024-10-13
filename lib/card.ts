interface Button {
  type: 'web_url' | 'postback'
  url?: string // Optional, as only one button uses this
  title: string
  payload?: string // Optional, as only the postback button uses this
}

interface DefaultAction {
  type: 'web_url'
  url: string
  webview_height_ratio: 'tall' | 'compact' | 'full'
}

interface CardData {
  title: string
  image_url: string
  subtitle: string
  default_action: DefaultAction
  buttons: Button[]
}

export default function card(
  title: string,
  image_url: string,
  subtitle: string,
  default_action: DefaultAction,
  buttons: Button[]
): CardData {
  return {
    title,
    image_url,
    subtitle,
    default_action,
    buttons,
  }
}

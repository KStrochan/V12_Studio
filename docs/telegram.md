# Telegram notifications

New bookings and consultation requests are sent to the owner's chat. Booking messages have
"Підтвердити" / "Відхилити" buttons; pressing one moves the booking from `pending` to
`confirmed` / `rejected` (repeat presses change nothing) and edits the message.

## Environment

| Variable | Meaning |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather |
| `TELEGRAM_OWNER_CHAT_ID` | Chat id of the owner; the webhook only accepts buttons pressed there |
| `TELEGRAM_WEBHOOK_SECRET` | Random string (A-Z a-z 0-9 _ -, up to 256 chars) |

## Register the webhook

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://<your-domain>/api/telegram/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>" \
  -d 'allowed_updates=["callback_query"]'
```

Telegram then sends the secret in the `x-telegram-bot-api-secret-token` header; requests
without it get 401. Telegram failures never block creating a booking or consultation.

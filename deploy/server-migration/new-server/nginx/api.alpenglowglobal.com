# AlpenGlow API on the new server. Replaces the old server's site file.
#
# What changed and why (see security-test.sh baseline, 2026-10 on the old
# server):
#   * Only /functions/v1/ and /rest/v1/ are reachable. The old file passed
#     everything to Kong, which put Supabase Studio, Auth sign-up, Storage
#     and the analytics endpoint on the internet.
#   * Requests are rate limited per IP. Zones "alpenglow_api" and
#     "alpenglow_otp" (AlpenGlow's own, so another project's traffic never
#     uses up this allowance) and the
#     proxy snippet are written by 01-base-setup.sh.
#   * The WhatsApp webhook is not limited, so Meta is never refused.
#
# Studio is still there for you: open an SSH tunnel and browse locally.
#   ssh -L 8000:127.0.0.1:8000 deploy@SERVER   then  http://localhost:8000
#
# Certificate paths match what certbot restores from the old server.

server {
    listen 80;
    listen [::]:80;
    server_name api.alpenglowglobal.com;

    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.alpenglowglobal.com;

    ssl_certificate     /etc/letsencrypt/live/api.alpenglowglobal.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.alpenglowglobal.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 5m;
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Meta calls this from many addresses; never rate limit it.
    location = /functions/v1/whatsapp-webhook {
        include snippets/proxy-to-stack.conf;
        proxy_pass http://127.0.0.1:8000;
    }

    # Each call here sends an SMS, WhatsApp message or email, so keep it slow.
    # The functions also have their own limiter; this stops floods earlier.
    location ~ ^/functions/v1/(send-sms-otp|send-email-otp)$ {
        limit_req zone=alpenglow_otp burst=10 nodelay;
        include snippets/proxy-to-stack.conf;
        proxy_pass http://127.0.0.1:8000;
    }

    location /functions/v1/ {
        limit_req zone=alpenglow_api burst=60 nodelay;
        include snippets/proxy-to-stack.conf;
        proxy_pass http://127.0.0.1:8000;
    }

    # Used by the trip planner and the CMS reads.
    location /rest/v1/ {
        limit_req zone=alpenglow_api burst=60 nodelay;
        include snippets/proxy-to-stack.conf;
        proxy_pass http://127.0.0.1:8000;
    }

    location / { return 404; }
}

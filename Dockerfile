FROM nginx:alpine

ARG GIT_SHA=0.0.0-placeholder

COPY src/ /usr/share/nginx/html/

RUN find /usr/share/nginx/html -type f \( -name '*.js' -o -name '*.json' -o -name '*.html' \) -exec \
    sed -i "s/0\.0\.0-placeholder/${GIT_SHA}/g" {} +

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# syntax=docker/dockerfile:1
# Workbench API (Spring Boot 4, Java 25). KHÔNG có bí mật nào trong image — cấu hình truyền lúc chạy.

# ---- Build: Maven + JDK ----
FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /src
COPY .mvn .mvn
COPY mvnw pom.xml lombok.config ./
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -q dependency:go-offline
COPY src src
# Test chạy ở CI (cần Docker cho Testcontainers) — ở đây chỉ đóng gói.
# Tách jar thành các lớp: thư viện ít đổi nằm lớp dưới → build lại nhanh, kéo image nhẹ hơn.
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -q -DskipTests package \
 && java -Djarmode=tools -jar target/app.jar extract --layers --launcher --destination target/extracted

# ---- Image chạy thật: chỉ JRE ----
FROM eclipse-temurin:25-jre-alpine AS runner
RUN addgroup -S -g 1001 app && adduser -S -u 1001 -G app app
WORKDIR /app
COPY --from=build --chown=app:app /src/target/extracted/dependencies/ ./
COPY --from=build --chown=app:app /src/target/extracted/spring-boot-loader/ ./
COPY --from=build --chown=app:app /src/target/extracted/snapshot-dependencies/ ./
COPY --from=build --chown=app:app /src/target/extracted/application/ ./
USER app
EXPOSE 8080
# JVM dùng tối đa 75% RAM được cấp cho container
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"

LABEL org.opencontainers.image.title="Workbench API" \
      org.opencontainers.image.description="Backend Spring Boot của Workbench: REST API, đăng nhập Google, nhắc việc Telegram" \
      org.opencontainers.image.source="https://github.com/Son30-kins/workbench" \
      org.opencontainers.image.licenses="MIT"

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]

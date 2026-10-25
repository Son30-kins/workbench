package io.github.son30kins.workbench.infrastructure.telegram;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.service.annotation.PostExchange;

/**
 * Telegram Bot API khai báo bằng HTTP interface của Spring: chỉ viết interface, Spring sinh client
 * (xem {@link TelegramClient}). Base URL = https://api.telegram.org/bot&lt;token&gt;.
 */
interface TelegramApi {

	@PostExchange("/getMe")
	Response<BotUser> getMe();

	@PostExchange("/getUpdates")
	Response<List<Update>> getUpdates(@RequestBody GetUpdates request);

	@PostExchange("/sendMessage")
	Response<Message> sendMessage(@RequestBody SendMessage request);

	@PostExchange("/answerCallbackQuery")
	Response<Boolean> answerCallbackQuery(@RequestBody AnswerCallbackQuery request);

	@PostExchange("/editMessageText")
	Response<Object> editMessageText(@RequestBody EditMessageText request);

	@PostExchange("/editMessageReplyMarkup")
	Response<Object> editMessageReplyMarkup(@RequestBody EditMessageReplyMarkup request);

	@PostExchange("/setMyCommands")
	Response<Boolean> setMyCommands(@RequestBody SetMyCommands request);

	// ===== Kiểu dữ liệu (chỉ những trường app dùng) =====

	@JsonIgnoreProperties(ignoreUnknown = true)
	record Response<T>(boolean ok, T result, String description) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	record BotUser(long id, String username) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	record Update(@JsonProperty("update_id") long updateId, Message message,
			@JsonProperty("callback_query") CallbackQuery callbackQuery) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	record Message(@JsonProperty("message_id") long messageId, Chat chat, From from, String text) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	record Chat(long id) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	record From(long id, String username, @JsonProperty("language_code") String languageCode) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	record CallbackQuery(String id, From from, Message message, String data) {
	}

	record GetUpdates(long offset, int timeout, @JsonProperty("allowed_updates") List<String> allowedUpdates) {
	}

	@JsonInclude(JsonInclude.Include.NON_NULL)
	record SendMessage(@JsonProperty("chat_id") String chatId, String text, @JsonProperty("parse_mode") String parseMode,
			@JsonProperty("link_preview_options") LinkPreviewOptions linkPreviewOptions,
			@JsonProperty("reply_markup") InlineKeyboardMarkup replyMarkup) {
	}

	record LinkPreviewOptions(@JsonProperty("is_disabled") boolean disabled) {
	}

	record InlineKeyboardMarkup(@JsonProperty("inline_keyboard") List<List<InlineKeyboardButton>> inlineKeyboard) {
	}

	@JsonInclude(JsonInclude.Include.NON_NULL)
	record InlineKeyboardButton(String text, @JsonProperty("callback_data") String callbackData, String url) {
	}

	@JsonInclude(JsonInclude.Include.NON_NULL)
	record AnswerCallbackQuery(@JsonProperty("callback_query_id") String callbackQueryId, String text,
			@JsonProperty("show_alert") Boolean showAlert) {
	}

	record EditMessageText(@JsonProperty("chat_id") String chatId, @JsonProperty("message_id") long messageId,
			String text, @JsonProperty("parse_mode") String parseMode) {
	}

	record EditMessageReplyMarkup(@JsonProperty("chat_id") String chatId, @JsonProperty("message_id") long messageId) {
	}

	@JsonInclude(JsonInclude.Include.NON_NULL)
	record SetMyCommands(List<BotCommand> commands, @JsonProperty("language_code") String languageCode) {
	}

	record BotCommand(String command, String description) {
	}

}

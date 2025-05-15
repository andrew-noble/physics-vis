package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/invopop/jsonschema"
	"github.com/joho/godotenv"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

var client openai.Client  // Remove the * to make it a struct instead of pointer

type LlmRequest struct {
	Prompt string `json:"prompt"`
}

type FbdGenerationRequest struct {
	Prompt string `json:"prompt"`
}

func appendToLog(prompt, response string) {
	f, err := os.OpenFile("./logs/llm_logs.txt", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Printf("Error opening log file: %v", err)
		return
	}
	defer f.Close()

	timestamp := time.Now().Format("2006-01-02 15:04:05")
	logEntry := fmt.Sprintf("[%s]\nPrompt: %s\nResponse: %s\n---\n", timestamp, prompt, response)
	
	if _, err := f.WriteString(logEntry); err != nil {
		log.Printf("Error writing to log file: %v", err)
	}
}

func getTest(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, "Hello, World!")
}

func getLlmResponse(c *gin.Context) {
	var req LlmRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	chatCompletion, err := client.Chat.Completions.New(c.Request.Context(), openai.ChatCompletionNewParams{
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.UserMessage(req.Prompt),
		},
		Model: openai.ChatModelO3Mini,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := chatCompletion.Choices[0].Message.Content

	c.JSON(http.StatusOK, gin.H{
		"response": response,
	})
}

func GenerateJsonSchema[T any]() any {
	// Structured Outputs uses a subset of JSON schema
	// These flags are necessary to comply with the subset
	reflector := jsonschema.Reflector{
		AllowAdditionalProperties: false,
		DoNotReference:            true,
	}
	var v T
	schema := reflector.Reflect(v)
	return schema
}

var FbdSchema = GenerateJsonSchema[Fbd]()

func getFbdResponse(c *gin.Context) {
	//this validates incoming request format
	var req FbdGenerationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// this sends the OpenAI call
	chatCompletion, err := client.Chat.Completions.New(c.Request.Context(), openai.ChatCompletionNewParams{
		Model: openai.ChatModelGPT4o,
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage(FbdGenerationSystemPrompt),
			openai.UserMessage(req.Prompt),
		},
		ResponseFormat: openai.ChatCompletionNewParamsResponseFormatUnion{
			OfJSONSchema: &openai.ResponseFormatJSONSchemaParam{
				JSONSchema: openai.ResponseFormatJSONSchemaJSONSchemaParam{
					Schema: FbdSchema,
					Strict: openai.Bool(true),
					Name:   "fbd",
					Description: openai.String("A free body diagram"),
				},
			},
		},
	})

	// handles errors from api call
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := chatCompletion.Choices[0].Message.Content
	appendToLog(req.Prompt, response)

	// this parses the response from OpenAI
	var fbd Fbd
	err = json.Unmarshal([]byte(response), &fbd)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, fbd)
}

func main() {
	// Load .env file first
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found")
	}

	// Initialize the client
	client = openai.NewClient(option.WithAPIKey(os.Getenv("OPENAI_API_KEY")))

	// Get environment variables
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // default port
	}

	router := gin.Default()
	
	// Configure CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // Vite's default port
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	router.GET("/test", getTest)
	router.POST("/llm", getLlmResponse)
	router.POST("/fbd", getFbdResponse)
	router.Run("localhost:" + port)
}

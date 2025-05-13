package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

var client openai.Client  // Remove the * to make it a struct instead of pointer

func getTest(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, "Hello, World!")
}

func getLlmResponse(c *gin.Context) {
	chatCompletion, err := client.Chat.Completions.New(c.Request.Context(), openai.ChatCompletionNewParams{
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.UserMessage("Say this is a test"),
		},
		Model: openai.ChatModelGPT4o,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"response": chatCompletion.Choices[0].Message.Content,
	})
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
	router.GET("/test", getTest)
	router.POST("/llm", getLlmResponse)
	router.Run("localhost:" + port)
}

package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
	_ "github.com/openai/openai-go/shared"
)

func getTest(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, "Hello, World!")
}

func getLlmResponse(c *gin.Context) {
	// Initialize OpenAI client
	client := openai.NewClient(option.WithAPIKey(os.Getenv("OPENAI_API_KEY")))

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
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found")
	}

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

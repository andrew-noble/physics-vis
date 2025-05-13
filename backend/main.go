package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func getTest(c *gin.Context) {
    c.IndentedJSON(http.StatusOK, "Hello, World!")
}

func main() {
    router := gin.Default()
    router.GET("/test", getTest)
    router.Run("localhost:8080")
}

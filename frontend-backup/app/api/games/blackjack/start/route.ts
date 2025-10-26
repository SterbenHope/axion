import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { betAmount } = await request.json()

    if (!betAmount || betAmount < 10 || betAmount > 1000) {
      return NextResponse.json({ error: "Invalid bet amount" }, { status: 400 })
    }

    // Create a simple deck of cards
    const suits: ("hearts" | "diamonds" | "clubs" | "spades")[] = ["hearts", "diamonds", "clubs", "spades"]
    const ranks: ("A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K")[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
    
    const deck: Array<{ suit: string; rank: string; value: number }> = []
    
    for (const suit of suits) {
      for (const rank of ranks) {
        let value = 0
        if (rank === "A") value = 11
        else if (["J", "Q", "K"].includes(rank)) value = 10
        else value = parseInt(rank)
        
        deck.push({ suit, rank, value })
      }
    }

          // Shuffle the deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      if (deck[i] && deck[j]) {
        const temp = deck[i]!
        deck[i] = deck[j]!
        deck[j] = temp
      }
    }

          // Deal initial cards
    const playerHand = [deck.pop()!, deck.pop()!]
    const dealerHand = [deck.pop()!, deck.pop()!]

          // Check for blackjack
    const playerScore = playerHand.reduce((sum, card) => sum + card.value, 0)
    const dealerScore = dealerHand.reduce((sum, card) => sum + card.value, 0)

    let gameStatus: string = "playing"
    if (playerScore === 21) gameStatus = "player_blackjack"
    else if (dealerScore === 21) gameStatus = "dealer_blackjack"

    const gameState = {
      playerHand,
              dealerHand: [dealerHand[0]], // Show only dealer's first card
      deck,
      playerScore,
              dealerScore: dealerHand[0]?.value || 0, // Show only first card
      gameStatus,
      canDouble: true,
      canSplit: false
    }

    return NextResponse.json({
      success: true,
      gameState,
      betAmount,
              message: "Game started!"
    })
  } catch (error) {
    console.error("Blackjack start error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

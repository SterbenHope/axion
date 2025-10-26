import { NextResponse } from "next/server"

type Suit = "hearts" | "diamonds" | "clubs" | "spades"
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K"

interface Card {
  suit: Suit
  rank: Rank
  value: number
}

interface GameState {
  playerHand: Card[]
  dealerHand: Card[]
  deck: Card[]
  playerScore: number
  dealerScore: number
  gameStatus:
    | "playing"
    | "player_blackjack"
    | "dealer_blackjack"
    | "player_bust"
    | "dealer_bust"
    | "player_wins"
    | "dealer_wins"
    | "push"
  canDouble: boolean
  canSplit: boolean
}

function calculateScore(hand: Card[]): number {
  let score = 0
  let aces = 0

  for (const card of hand) {
    if (card.rank === "A") {
      aces++
      score += 11
    } else {
      score += card.value
    }
  }

  while (score > 21 && aces > 0) {
    score -= 10
    aces--
  }

  return score
}

function dealerShouldHit(dealerScore: number): boolean {
  return dealerScore < 17
}

function determineWinner(playerScore: number, dealerScore: number): GameState["gameStatus"] {
  if (playerScore > 21) return "player_bust"
  if (dealerScore > 21) return "dealer_bust"
  if (playerScore > dealerScore) return "player_wins"
  if (dealerScore > playerScore) return "dealer_wins"
  return "push"
}

function calculatePayout(gameStatus: GameState["gameStatus"], betAmount: number): number {
  switch (gameStatus) {
    case "player_blackjack":
      return betAmount * 2.5 // Blackjack pays 3:2
    case "player_wins":
    case "dealer_bust":
      return betAmount * 2
    case "push":
      return betAmount // Return bet
    default:
      return 0 // Loss
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, gameState, betAmount } = body

    if (!gameState || !betAmount) {
      return NextResponse.json({ error: "Invalid game state" }, { status: 400 })
    }

    const newGameState: GameState = { ...gameState }

    if (action === "hit") {
      // Player hits
      const newCard = newGameState.deck.pop()!
      newGameState.playerHand.push(newCard)
      newGameState.playerScore = calculateScore(newGameState.playerHand)
      newGameState.canDouble = false
      newGameState.canSplit = false

      if (newGameState.playerScore > 21) {
        newGameState.gameStatus = "player_bust"
      }
    } else if (action === "stand" || action === "double") {
      if (action === "double") {
        // Double down - add one card
        const newCard = newGameState.deck.pop()!
        newGameState.playerHand.push(newCard)
        newGameState.playerScore = calculateScore(newGameState.playerHand)

        if (newGameState.playerScore > 21) {
          newGameState.gameStatus = "player_bust"
        }
      }

      // Dealer plays if player didn't bust
      if (newGameState.playerScore <= 21) {
        while (dealerShouldHit(newGameState.dealerScore)) {
          const newCard = newGameState.deck.pop()!
          newGameState.dealerHand.push(newCard)
          newGameState.dealerScore = calculateScore(newGameState.dealerHand)
        }

        newGameState.gameStatus = determineWinner(newGameState.playerScore, newGameState.dealerScore)
      }

      newGameState.canDouble = false
      newGameState.canSplit = false
    }

    // If game is over, process payout
    if (newGameState.gameStatus !== "playing") {
      const finalBetAmount = action === "double" ? betAmount * 2 : betAmount
      const payout = calculatePayout(newGameState.gameStatus, finalBetAmount)
      const netResult = payout - finalBetAmount

      // Demo logic without database
      console.log("Game finished:", {
        action,
        betAmount: finalBetAmount,
        payout,
        netResult,
        gameStatus: newGameState.gameStatus
      })

      return NextResponse.json({
        gameState: newGameState,
        payout,
        netResult,
        newBalance: 2500 + netResult, // Demo balance
        finalBetAmount,
      })
    }

    return NextResponse.json({
      gameState: newGameState,
    })
  } catch (error) {
    console.error("Blackjack action error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

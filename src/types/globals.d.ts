export { }

declare global {
    interface CustomJwtSessionClaims {
        metadata: {
            role?: 'coach' | 'athlete'
        }
    }
}

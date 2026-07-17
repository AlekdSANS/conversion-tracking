function FormStatus({ errorMessage, successMessage }) {
  return (
    <div className="form-status" aria-live="polite" aria-atomic="true">
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}
    </div>
  )
}

export default FormStatus

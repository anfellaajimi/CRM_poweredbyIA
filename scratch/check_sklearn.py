try:
    from sklearn.linear_model import LinearRegression
    print("scikit-learn is installed")
except ImportError:
    print("scikit-learn is NOT installed")

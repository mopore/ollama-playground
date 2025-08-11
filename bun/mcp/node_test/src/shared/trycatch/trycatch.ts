// Types for the result object with discriminated union
type Success<T> = {
	result: T;
	error: null;
};

type Failure<E> = {
	result: null;
	error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

export const tryCatchAsync = async <T, E = Error>(
	promise: Promise<T>,
): Promise<Result<T, E>> => {
	try {
		const result = await promise;
		return { 
			result, 
			error: null 
		};
	} catch (error) {
		return { 
			result: null, 
			error: error as E 
		};
	}
}

export const tryCatch = <T, E = Error>(
	fn: () => T
): Result<T,E> => {
  try {
    const result = fn();
    return { 
		result, 
		error: null 
	};
  } catch (err) {
    return { 
		result: null, 
		error: err as E 
	};
  }
}